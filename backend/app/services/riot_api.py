"""
Riot Games API Service
Handles requests to Riot's various APIs (Account, Summoner, League, etc.)
"""
import os
import httpx
from typing import Optional, Dict, Any, List
from fastapi import HTTPException


class RiotAPIService:
    """Riot Games API service for fetching player data"""

    def __init__(self):
        self.api_key = os.getenv("API_RIOT", "")

        # Regional routing values for Account API
        self.regional_endpoints = {
            "americas": "https://americas.api.riotgames.com",
            "europe": "https://europe.api.riotgames.com",
            "asia": "https://asia.api.riotgames.com",
            "sea": "https://sea.api.riotgames.com"
        }

        # Platform routing values for Summoner/League APIs
        self.platform_endpoints = {
            "BR1": "https://br1.api.riotgames.com",
            "EUN1": "https://eun1.api.riotgames.com",
            "EUW1": "https://euw1.api.riotgames.com",
            "JP1": "https://jp1.api.riotgames.com",
            "KR": "https://kr.api.riotgames.com",
            "LA1": "https://la1.api.riotgames.com",
            "LA2": "https://la2.api.riotgames.com",
            "NA1": "https://na1.api.riotgames.com",
            "OC1": "https://oc1.api.riotgames.com",
            "TR1": "https://tr1.api.riotgames.com",
            "RU": "https://ru.api.riotgames.com",
            "PH2": "https://ph2.api.riotgames.com",
            "SG2": "https://sg2.api.riotgames.com",
            "TH2": "https://th2.api.riotgames.com",
            "TW2": "https://tw2.api.riotgames.com",
            "VN2": "https://vn2.api.riotgames.com"
        }

        # Region to platform mapping
        self.region_to_platform = {
            "americas": ["BR1", "LA1", "LA2", "NA1"],
            "europe": ["EUN1", "EUW1", "TR1", "RU"],
            "asia": ["JP1", "KR"],
            "sea": ["OC1", "PH2", "SG2", "TH2", "TW2", "VN2"]
        }

    def get_regional_endpoint(self, platform: str) -> str:
        """Get the regional endpoint for a given platform"""
        for region, platforms in self.region_to_platform.items():
            if platform in platforms:
                return self.regional_endpoints[region]
        return self.regional_endpoints["europe"]  # Default

    def clean_riot_id(self, text: str) -> str:
        """
        Clean Riot ID from invisible Unicode characters
        Removes directional marks, zero-width characters, etc.
        """
        import unicodedata
        import re

        # Normalize Unicode (decompose then recompose)
        text = unicodedata.normalize('NFKC', text)

        # Remove directional marks and other format characters
        text = ''.join(char for char in text if unicodedata.category(char) != 'Cf')

        # Remove zero-width and other invisible characters
        invisible_chars = [
            '\u200b',  # Zero-width space
            '\u200c',  # Zero-width non-joiner
            '\u200d',  # Zero-width joiner
            '\u2060',  # Word joiner
            '\u2066',  # Left-to-right isolate
            '\u2067',  # Right-to-left isolate
            '\u2068',  # First strong isolate
            '\u2069',  # Pop directional isolate
            '\ufeff',  # Zero-width no-break space (BOM)
        ]
        for char in invisible_chars:
            text = text.replace(char, '')

        return text.strip()

    async def get_account_by_riot_id(
        self,
        game_name: str,
        tag_line: str,
        region: str = "europe"
    ) -> Dict[str, Any]:
        """
        Get account information by Riot ID (Game Name + Tag Line)

        Args:
            game_name: Riot Game Name
            tag_line: Riot Tag Line (without #)
            region: Regional routing (americas, europe, asia, sea)

        Returns:
            Dict with puuid, gameName, tagLine
        """
        # Clean invisible Unicode characters
        game_name = self.clean_riot_id(game_name)
        tag_line = self.clean_riot_id(tag_line)

        endpoint = self.regional_endpoints.get(region, self.regional_endpoints["europe"])
        url = f"{endpoint}/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"



        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "X-Riot-Token": self.api_key
                    }
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Riot account not found: {game_name}#{tag_line} on region {region}. Make sure the name and tag are correct."
                    )
                elif response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Riot API error: {response.text}"
                    )

                return response.json()

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during Riot API call: {str(e)}"
                )

    async def get_account_by_puuid(self, puuid: str, region: str = "europe") -> Dict[str, Any]:
        """
        Get account information by PUUID

        Args:
            puuid: Player Universal Unique Identifier
            region: Regional routing

        Returns:
            Dict with puuid, gameName, tagLine
        """
        endpoint = self.regional_endpoints.get(region, self.regional_endpoints["europe"])
        url = f"{endpoint}/riot/account/v1/accounts/by-puuid/{puuid}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "X-Riot-Token": self.api_key
                    }
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Riot API error: {response.text}"
                    )

                return response.json()

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during Riot API call: {str(e)}"
                )

    async def get_summoner_by_puuid(self, puuid: str, platform: str = "EUW1") -> Dict[str, Any]:
        """
        Get summoner information by PUUID

        Args:
            puuid: Player Universal Unique Identifier
            platform: Platform routing (EUW1, NA1, etc.)

        Returns:
            Dict with id, accountId, puuid, profileIconId, summonerLevel, etc.
        """
        endpoint = self.platform_endpoints.get(platform, self.platform_endpoints["EUW1"])
        url = f"{endpoint}/lol/summoner/v4/summoners/by-puuid/{puuid}"


        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "X-Riot-Token": self.api_key
                    }
                )

                # Log response body for debugging
                response_data = response.json() if response.status_code == 200 else None
                if response.status_code == 200:

                    # CRITICAL FIX: Riot API v4 now returns 'id' field but some responses don't include it
                    # The 'id' is actually stored in a different field or we need to construct it
                    # For now, if 'id' is missing, we'll try to fetch ranked data using PUUID directly
                    if 'id' not in response_data and 'puuid' in response_data:


                        # Try to get the summoner ID from ranked entries
                        try:
                            ranked_url = f"{endpoint}/lol/league/v4/entries/by-summoner/{puuid}"

                        except Exception as e:
                            pass

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Summoner not found on platform {platform}. This account may not have played League of Legends on this server."
                    )
                elif response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Riot API error: {response.text}"
                    )

                return response_data

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during Riot API call: {str(e)}"
                )

    async def get_league_entries_by_puuid(self, puuid: str, platform: str = "EUW1") -> List[Dict[str, Any]]:
        """
        Get ranked information for a summoner by PUUID

        Args:
            puuid: Player Universal Unique Identifier
            platform: Platform routing

        Returns:
            List of league entries (RANKED_SOLO_5x5, RANKED_FLEX_SR, etc.)
        """
        endpoint = self.platform_endpoints.get(platform, self.platform_endpoints["EUW1"])

        # Try the new PUUID-based endpoint first
        url = f"{endpoint}/lol/league/v4/entries/by-puuid/{puuid}"


        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "X-Riot-Token": self.api_key
                    }
                )

                if response.status_code == 404:

                    return []
                elif response.status_code != 200:

                    return []

                ranked_data = response.json()

                return ranked_data

            except httpx.HTTPError as e:
                return []

    async def get_league_entries(self, summoner_id: str, platform: str = "EUW1") -> List[Dict[str, Any]]:
        """
        Get ranked information for a summoner (DEPRECATED - use get_league_entries_by_puuid instead)

        Args:
            summoner_id: Encrypted summoner ID
            platform: Platform routing

        Returns:
            List of league entries (RANKED_SOLO_5x5, RANKED_FLEX_SR, etc.)
        """
        endpoint = self.platform_endpoints.get(platform, self.platform_endpoints["EUW1"])
        url = f"{endpoint}/lol/league/v4/entries/by-summoner/{summoner_id}"


        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "X-Riot-Token": self.api_key
                    }
                )

                if response.status_code != 200:

                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Riot API error: {response.text}"
                    )

                ranked_data = response.json()

                return ranked_data

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during Riot API call: {str(e)}"
                )

    async def get_champion_mastery(
        self,
        puuid: str,
        platform: str = "EUW1",
        top: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Get top champion masteries for a summoner

        Args:
            puuid: Player Universal Unique Identifier
            platform: Platform routing
            top: Number of top champions to fetch (default 3)

        Returns:
            List of champion mastery objects
        """
        endpoint = self.platform_endpoints.get(platform, self.platform_endpoints["EUW1"])
        url = f"{endpoint}/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top?count={top}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "X-Riot-Token": self.api_key
                    }
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Riot API error: {response.text}"
                    )

                return response.json()

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during Riot API call: {str(e)}"
                )

    async def get_match_history(
        self,
        puuid: str,
        region: str = "europe",
        count: int = 20,
        queue_id: int = 420  # 420 = Ranked Solo/Duo
    ) -> List[str]:
        """
        Get match history (match IDs) for a player

        Args:
            puuid: Player Universal Unique Identifier
            region: Regional routing (americas, europe, asia, sea)
            count: Number of matches to fetch
            queue_id: Queue ID (420 = Ranked Solo, 440 = Ranked Flex)

        Returns:
            List of match IDs
        """
        endpoint = self.regional_endpoints.get(region, self.regional_endpoints["europe"])
        url = f"{endpoint}/lol/match/v5/matches/by-puuid/{puuid}/ids"

        params = {
            "start": 0,
            "count": count,
            "queue": queue_id
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={"X-Riot-Token": self.api_key},
                    params=params
                )

                if response.status_code != 200:

                    return []

                return response.json()

            except httpx.HTTPError as e:
                return []

    async def get_match_details(self, match_id: str, region: str = "europe") -> Optional[Dict[str, Any]]:
        """
        Get detailed match information

        Args:
            match_id: Match ID
            region: Regional routing

        Returns:
            Match details or None if error
        """
        endpoint = self.regional_endpoints.get(region, self.regional_endpoints["europe"])
        url = f"{endpoint}/lol/match/v5/matches/{match_id}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={"X-Riot-Token": self.api_key}
                )

                if response.status_code != 200:
                    return None

                return response.json()

            except httpx.HTTPError:
                return None

    async def detect_preferred_role_from_matches(
        self,
        puuid: str,
        region: str = "europe",
        platform: str = "EUW1"
    ) -> Optional[str]:
        """
        Detect preferred role by analyzing recent ranked matches
        This is more accurate than champion-based detection

        Args:
            puuid: Player Universal Unique Identifier
            region: Regional routing for match API
            platform: Platform for region mapping

        Returns:
            Most played role (TOP, JUNGLE, MID, BOT, SUPPORT) or None
        """
        # Get last 20 ranked solo games
        match_ids = await self.get_match_history(puuid, region, count=20, queue_id=420)

        if not match_ids:

            return None

        # Count roles played
        role_counts = {}
        matches_analyzed = 0

        for match_id in match_ids[:15]:  # Analyze up to 15 recent matches
            match_data = await self.get_match_details(match_id, region)

            if not match_data:
                continue

            # Find player's data in the match
            participants = match_data.get("info", {}).get("participants", [])
            player_data = next((p for p in participants if p.get("puuid") == puuid), None)

            if not player_data:
                continue

            # Get the actual role played (from Riot's detection)
            team_position = player_data.get("teamPosition", "")
            individual_position = player_data.get("individualPosition", "")

            # Prefer teamPosition, fallback to individualPosition
            role = team_position or individual_position

            # Normalize role names
            role_map = {
                "TOP": "TOP",
                "JUNGLE": "JUNGLE",
                "MIDDLE": "MID",
                "MID": "MID",
                "BOTTOM": "BOT",
                "BOT": "BOT",
                "UTILITY": "SUPPORT",
                "SUPPORT": "SUPPORT"
            }

            role = role_map.get(role, role)

            if role in ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"]:
                role_counts[role] = role_counts.get(role, 0) + 1
                matches_analyzed += 1

        if not role_counts:
            return None

        # Return most played role
        most_played_role = max(role_counts, key=role_counts.get)

        return most_played_role

    async def verify_summoner_exists(
        self,
        game_name: str,
        tag_line: str,
        region: str = "europe",
        platform: str = "EUW1"
    ) -> Dict[str, Any]:
        """
        Verify if a summoner exists and get full information

        Args:
            game_name: Riot Game Name
            tag_line: Riot Tag Line
            region: Regional routing for Account API
            platform: Platform routing for Summoner API

        Returns:
            Dict with account info, summoner info, rank, and top champions
        """
        # Step 1: Get account by Riot ID

        account = await self.get_account_by_riot_id(game_name, tag_line, region)
        puuid = account["puuid"]

        # Step 2: Get summoner by PUUID

        try:
            summoner = await self.get_summoner_by_puuid(puuid, platform)
        except Exception as e:
            raise

        # Step 3: Get ranked info using PUUID (new method)

        try:
            ranked_info = await self.get_league_entries_by_puuid(puuid, platform)

        except Exception as e:
            ranked_info = []

        # Step 4: Get top champions
        try:
            top_champions = await self.get_champion_mastery(puuid, platform, top=3)
        except Exception:
            top_champions = []

        return {
            "account": account,
            "summoner": summoner,
            "ranked": ranked_info,
            "top_champions": top_champions
        }


# Global instance
riot_api_service = RiotAPIService()
