"""
OpenRift ROFL Parser - Riot Match-v5 Format
Converts League of Legends replay files (.rofl) to JSON format compatible with Riot API
Compatible with OpenRift analytics dashboard
"""

import json
import hashlib
import time
from pathlib import Path
from typing import List, Dict, Any

# ==================== ROFL PARSER ====================

def parse_rofl_file(rofl_path: Path) -> Dict[str, Any]:
    """Parse .rofl file and extract data in Riot match-v5 format"""
    try:
        with open(rofl_path, 'rb') as f:
            content = f.read()

        # Find the statsJson section
        json_start = content.find(b'{"gameLength":')

        if json_start == -1:
            print(f"Could not find game data in {rofl_path.name}")
            return None

        # Find the end of the JSON
        json_end = content.find(b',"gameId":', json_start)
        if json_end == -1:
            json_end = content.find(b'},"gameId":', json_start)

        if json_end == -1:
            # Count braces to find the end
            brace_count = 0
            for i in range(json_start, min(json_start + 500000, len(content))):
                if content[i:i+1] == b'{':
                    brace_count += 1
                elif content[i:i+1] == b'}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break

        if json_end == -1:
            print(f"Could not find end of JSON in {rofl_path.name}")
            return None

        # Extract and parse JSON
        json_bytes = content[json_start:json_end]
        json_str = json_bytes.decode('utf-8', errors='ignore')

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            json_str = json_str.rstrip(',') + '}'
            data = json.loads(json_str)

        # Parse the statsJson array
        stats_json = json.loads(data['statsJson']) if isinstance(data['statsJson'], str) else data['statsJson']

        # Generate match ID from file name and content hash
        match_id = generate_match_id(rofl_path, content)

        # Extract game duration
        game_duration_ms = data.get('gameLength', 0)
        game_duration_seconds = int(game_duration_ms / 1000)

        # Build participants list (Riot format)
        participants = []
        participant_puuids = []

        for idx, player_stats in enumerate(stats_json):
            participant = build_participant(player_stats, game_duration_seconds, idx)
            participants.append(participant)
            participant_puuids.append(participant['puuid'])

        # Build teams data
        teams = build_teams(stats_json)

        # Build match in Riot match-v5 format
        match_data = {
            "metadata": {
                "dataVersion": "2",
                "matchId": match_id,
                "participants": participant_puuids
            },
            "info": {
                "endOfGameResult": "GameComplete",
                "gameCreation": int(time.time() * 1000),  # Current timestamp as placeholder
                "gameDuration": game_duration_seconds,
                "gameEndTimestamp": int(time.time() * 1000),
                "gameId": int(hashlib.md5(match_id.encode()).hexdigest()[:15], 16),
                "gameMode": "CLASSIC",
                "gameName": "teambuilder-match",
                "gameStartTimestamp": int(time.time() * 1000) - (game_duration_ms),
                "gameType": "CUSTOM_GAME",
                "gameVersion": "14.24",  # Placeholder version
                "mapId": 11,  # Summoner's Rift
                "participants": participants,
                "platformId": "EUW1",
                "queueId": 0,  # Custom game
                "teams": teams,
                "tournamentCode": ""
            }
        }

        return match_data

    except Exception as e:
        print(f"❌ Error parsing {rofl_path.name}: {e}")
        return None


def generate_match_id(rofl_path: Path, content: bytes) -> str:
    """Generate a unique match ID from file"""
    # Use file name + content hash for unique ID
    file_hash = hashlib.md5(content[:10000]).hexdigest()[:10]
    return f"EUW1_{file_hash}"


def build_participant(player_stats: Dict, game_duration: int, participant_id: int) -> Dict:
    """Build a participant object in Riot match-v5 format"""

    # Extract basic stats
    kills = int(player_stats.get('CHAMPIONS_KILLED', 0))
    deaths = int(player_stats.get('NUM_DEATHS', 0))
    assists = int(player_stats.get('ASSISTS', 0))

    # Calculate KDA
    kda = round((kills + assists) / deaths, 2) if deaths > 0 else float(kills + assists)

    # CS calculation
    minions_killed = int(player_stats.get('MINIONS_KILLED', 0))
    neutral_minions_killed = int(player_stats.get('NEUTRAL_MINIONS_KILLED', 0))
    total_minions_killed = minions_killed + neutral_minions_killed

    # Generate a fake PUUID from Riot ID
    riot_id_name = player_stats.get('RIOT_ID_GAME_NAME', 'Unknown')
    riot_id_tag = player_stats.get('RIOT_ID_TAG_LINE', 'TAG')
    fake_puuid = hashlib.sha256(f"{riot_id_name}#{riot_id_tag}".encode()).hexdigest()[:78]

    # Win status
    win = player_stats.get('WIN') == 'Win'

    # Team (100 = BLUE, 200 = RED)
    team_id = 100 if player_stats.get('TEAM') == '100' else 200

    # Champion name (from SKIN field)
    champion_name = player_stats.get('SKIN', 'Unknown')

    # Build the participant object
    participant = {
        "assists": assists,
        "baronKills": 0,  # Not available in ROFL
        "bountyLevel": 0,
        "champExperience": 0,
        "champLevel": int(player_stats.get('LEVEL', 0)),
        "championId": 0,  # Not easily mappable from SKIN name
        "championName": champion_name,
        "commandPings": 0,
        "championTransform": 0,
        "consumablesPurchased": 0,
        "damageDealtToBuildings": int(player_stats.get('TOTAL_DAMAGE_DEALT_TO_BUILDINGS', 0)),
        "damageDealtToObjectives": int(player_stats.get('TOTAL_DAMAGE_DEALT_TO_OBJECTIVES', 0)),
        "damageDealtToTurrets": int(player_stats.get('TOTAL_DAMAGE_DEALT_TO_TURRETS', 0)),
        "damageSelfMitigated": int(player_stats.get('TOTAL_DAMAGE_SELF_MITIGATED', 0)),
        "deaths": deaths,
        "detectorWardsPlaced": int(player_stats.get('WARD_PLACED_DETECTOR', 0)),
        "doubleKills": int(player_stats.get('DOUBLE_KILLS', 0)),
        "dragonKills": 0,
        "eligibleForProgression": True,
        "firstBloodAssist": False,
        "firstBloodKill": False,
        "firstTowerAssist": False,
        "firstTowerKill": False,
        "gameEndedInEarlySurrender": False,
        "gameEndedInSurrender": False,
        "goldEarned": int(player_stats.get('GOLD_EARNED', 0)),
        "goldSpent": int(player_stats.get('GOLD_SPENT', 0)),
        "individualPosition": player_stats.get('TEAM_POSITION', 'Invalid'),
        "inhibitorKills": int(player_stats.get('BARRACKS_KILLED', 0)),
        "inhibitorTakedowns": int(player_stats.get('BARRACKS_KILLED', 0)),
        "inhibitorsLost": 0,
        "item0": int(player_stats.get('ITEM0', 0)),
        "item1": int(player_stats.get('ITEM1', 0)),
        "item2": int(player_stats.get('ITEM2', 0)),
        "item3": int(player_stats.get('ITEM3', 0)),
        "item4": int(player_stats.get('ITEM4', 0)),
        "item5": int(player_stats.get('ITEM5', 0)),
        "item6": int(player_stats.get('ITEM6', 0)),
        "itemsPurchased": 0,
        "killingSprees": int(player_stats.get('KILLING_SPREES', 0)),
        "kills": kills,
        "lane": player_stats.get('TEAM_POSITION', 'Invalid'),
        "largestCriticalStrike": int(player_stats.get('LARGEST_CRITICAL_STRIKE', 0)),
        "largestKillingSpree": int(player_stats.get('LARGEST_KILLING_SPREE', 0)),
        "largestMultiKill": int(player_stats.get('LARGEST_MULTI_KILL', 0)),
        "longestTimeSpentLiving": 0,
        "magicDamageDealt": int(player_stats.get('MAGIC_DAMAGE_DEALT_PLAYER', 0)),
        "magicDamageDealtToChampions": int(player_stats.get('MAGIC_DAMAGE_DEALT_TO_CHAMPIONS', 0)),
        "magicDamageTaken": int(player_stats.get('MAGIC_DAMAGE_TAKEN', 0)),
        "neutralMinionsKilled": neutral_minions_killed,
        "nexusKills": 0,
        "nexusLost": 0,
        "nexusTakedowns": 0,
        "objectivesStolen": 0,
        "objectivesStolenAssists": 0,
        "participantId": participant_id + 1,
        "pentaKills": int(player_stats.get('PENTA_KILLS', 0)),
        "physicalDamageDealt": int(player_stats.get('PHYSICAL_DAMAGE_DEALT_PLAYER', 0)),
        "physicalDamageDealtToChampions": int(player_stats.get('PHYSICAL_DAMAGE_DEALT_TO_CHAMPIONS', 0)),
        "physicalDamageTaken": int(player_stats.get('PHYSICAL_DAMAGE_TAKEN', 0)),
        "placement": 0,
        "playerAugment1": 0,
        "playerAugment2": 0,
        "playerAugment3": 0,
        "playerAugment4": 0,
        "playerScore0": 0,
        "playerScore1": 0,
        "playerScore2": 0,
        "playerScore3": 0,
        "playerScore4": 0,
        "playerScore5": 0,
        "playerScore6": 0,
        "playerScore7": 0,
        "playerScore8": 0,
        "playerScore9": 0,
        "playerScore10": 0,
        "playerScore11": 0,
        "profileIcon": 0,
        "puuid": fake_puuid,
        "quadraKills": int(player_stats.get('QUADRA_KILLS', 0)),
        "riotIdGameName": riot_id_name,
        "riotIdTagline": riot_id_tag,
        "role": player_stats.get('TEAM_POSITION', 'Invalid'),
        "sightWardsBoughtInGame": 0,
        "spell1Casts": 0,
        "spell2Casts": 0,
        "spell3Casts": 0,
        "spell4Casts": 0,
        "summoner1Casts": 0,
        "summoner1Id": 0,
        "summoner2Casts": 0,
        "summoner2Id": 0,
        "summonerId": "",
        "summonerLevel": 0,
        "summonerName": f"{riot_id_name}#{riot_id_tag}",
        "teamEarlySurrendered": False,
        "teamId": team_id,
        "teamPosition": player_stats.get('TEAM_POSITION', 'Invalid'),
        "timeCCingOthers": int(player_stats.get('TIME_CCING_OTHERS', 0)),
        "timePlayed": int(player_stats.get('TIME_PLAYED', 0)),
        "totalDamageDealt": int(player_stats.get('TOTAL_DAMAGE_DEALT', 0)),
        "totalDamageDealtToChampions": int(player_stats.get('TOTAL_DAMAGE_DEALT_TO_CHAMPIONS', 0)),
        "totalDamageShieldedOnTeammates": int(player_stats.get('TOTAL_DAMAGE_SHIELDED_ON_TEAMMATES', 0)),
        "totalDamageTaken": int(player_stats.get('TOTAL_DAMAGE_TAKEN', 0)),
        "totalHeal": int(player_stats.get('TOTAL_HEAL', 0)),
        "totalHealsOnTeammates": int(player_stats.get('TOTAL_HEAL_ON_TEAMMATES', 0)),
        "totalMinionsKilled": minions_killed,
        "totalTimeCCDealt": int(player_stats.get('TOTAL_TIME_CROWD_CONTROL_DEALT', 0)),
        "totalTimeSpentDead": int(player_stats.get('TOTAL_TIME_SPENT_DEAD', 0)),
        "totalUnitsHealed": 0,
        "tripleKills": int(player_stats.get('TRIPLE_KILLS', 0)),
        "trueDamageDealt": int(player_stats.get('TRUE_DAMAGE_DEALT_PLAYER', 0)),
        "trueDamageDealtToChampions": int(player_stats.get('TRUE_DAMAGE_DEALT_TO_CHAMPIONS', 0)),
        "trueDamageTaken": int(player_stats.get('TRUE_DAMAGE_TAKEN', 0)),
        "turretKills": int(player_stats.get('TURRETS_KILLED', 0)),
        "turretTakedowns": int(player_stats.get('TURRETS_KILLED', 0)),
        "turretsLost": 0,
        "unrealKills": int(player_stats.get('UNREAL_KILLS', 0)),
        "visionScore": int(player_stats.get('VISION_SCORE', 0)),
        "visionWardsBoughtInGame": int(player_stats.get('VISION_WARDS_BOUGHT_IN_GAME', 0)),
        "wardsKilled": int(player_stats.get('WARD_KILLED', 0)),
        "wardsPlaced": int(player_stats.get('WARD_PLACED', 0)),
        "win": win
    }

    return participant


def build_teams(stats_json: List[Dict]) -> List[Dict]:
    """Build teams data in Riot format"""

    teams_data = {
        100: {
            "bans": [],
            "objectives": {
                "baron": {"first": False, "kills": 0},
                "champion": {"first": False, "kills": 0},
                "dragon": {"first": False, "kills": 0},
                "inhibitor": {"first": False, "kills": 0},
                "riftHerald": {"first": False, "kills": 0},
                "tower": {"first": False, "kills": 0}
            },
            "teamId": 100,
            "win": False
        },
        200: {
            "bans": [],
            "objectives": {
                "baron": {"first": False, "kills": 0},
                "champion": {"first": False, "kills": 0},
                "dragon": {"first": False, "kills": 0},
                "inhibitor": {"first": False, "kills": 0},
                "riftHerald": {"first": False, "kills": 0},
                "tower": {"first": False, "kills": 0}
            },
            "teamId": 200,
            "win": False
        }
    }

    # Determine winning team
    for player_stats in stats_json:
        team_id = 100 if player_stats.get('TEAM') == '100' else 200
        if player_stats.get('WIN') == 'Win':
            teams_data[team_id]['win'] = True

    return [teams_data[100], teams_data[200]]


# ==================== MAIN ====================

def main():
    """Main execution"""
    print("=" * 60)
    print("🎮 OpenRift ROFL Parser v1.0")
    print("=" * 60)
    print()

    base_dir = Path(__file__).parent
    output_dir = base_dir / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Find all scrim folders (in current directory)
    scrim_folders = sorted([d for d in base_dir.iterdir() if d.is_dir() and d.name.startswith('Scrim')])

    if not scrim_folders:
        print("❌ No scrim folders found!")
        print("💡 Create folders named 'Scrim1', 'Scrim2', etc. and add .rofl files")
        return

    print(f"✅ Found {len(scrim_folders)} scrim folder(s)")
    print()

    all_matches = []

    # Process each scrim
    for scrim_folder in scrim_folders:
        scrim_name = scrim_folder.name
        print(f"Processing {scrim_name}...")

        # Find .rofl files
        rofl_files = list(scrim_folder.glob("*.rofl"))
        print(f"  Found {len(rofl_files)} .rofl file(s)")

        if not rofl_files:
            print("  Skipping (no .rofl files)")
            continue

        scrim_matches = []

        for rofl_file in rofl_files:
            print(f"  📄 Parsing {rofl_file.name}...", end=" ")
            match_data = parse_rofl_file(rofl_file)

            if match_data:
                scrim_matches.append(match_data)
                all_matches.append(match_data)
                print("✅ OK")
            else:
                print("❌ FAILED")

        if scrim_matches:
            # Save scrim matches
            output_file = output_dir / f"{scrim_name.lower()}_matches.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({"matches": scrim_matches}, f, indent=2, ensure_ascii=False)

            print(f"  💾 Saved: {output_file.name} ({len(scrim_matches)} matches)")

        print()

    # Save global matches file
    if all_matches:
        print("📦 Generating global matches file...")
        global_file = output_dir / "global_matches.json"
        with open(global_file, 'w', encoding='utf-8') as f:
            json.dump({"matches": all_matches}, f, indent=2, ensure_ascii=False)

        print(f"💾 Saved: {global_file.name} ({len(all_matches)} matches)")

    print()
    print("=" * 60)
    print("✅ DONE!")
    print(f"📊 Total matches parsed: {len(all_matches)}")
    print(f"📁 Output directory: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
