"""
Riot Games OAuth 2.0 Authentication Service
Handles the OAuth flow to authenticate users with their Riot account
"""
import os
import secrets
import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException


class RiotAuthService:
    """Riot OAuth 2.0 service"""

    def __init__(self):
        self.client_id = os.getenv("RIOT_CLIENT_ID", "")
        self.client_secret = os.getenv("RIOT_CLIENT_SECRET", "")
        self.api_key = os.getenv("API_RIOT", "")
        self.redirect_uri = os.getenv("RIOT_REDIRECT_URI", "http://localhost:3000/auth/riot/callback")

        # Riot OAuth endpoints
        self.authorize_url = "https://auth.riotgames.com/authorize"
        self.token_url = "https://auth.riotgames.com/token"
        self.userinfo_url = "https://auth.riotgames.com/userinfo"

        # Regional endpoints for Account API
        self.americas_account_api = "https://americas.api.riotgames.com"
        self.europe_account_api = "https://europe.api.riotgames.com"
        self.asia_account_api = "https://asia.api.riotgames.com"

    def get_authorization_url(self, state: Optional[str] = None) -> Dict[str, str]:
        """
        Generate the authorization URL for Riot OAuth

        Args:
            state: Optional state parameter for CSRF protection

        Returns:
            Dict with authorization URL and state
        """
        if not state:
            state = secrets.token_urlsafe(32)

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid",
            "state": state
        }

        # Build query string
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        auth_url = f"{self.authorize_url}?{query_string}"

        return {
            "authorization_url": auth_url,
            "state": state
        }

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from Riot OAuth callback

        Returns:
            Dict with access_token, refresh_token, expires_in
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.token_url,
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "redirect_uri": self.redirect_uri,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret
                    },
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Failed to exchange code for token: {response.text}"
                    )

                return response.json()

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during token exchange: {str(e)}"
                )

    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get user information from Riot using access token

        Args:
            access_token: OAuth access token

        Returns:
            Dict with user info (puuid, game_name, tag_line)
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.userinfo_url,
                    headers={
                        "Authorization": f"Bearer {access_token}"
                    }
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Failed to get user info: {response.text}"
                    )

                return response.json()

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during user info fetch: {str(e)}"
                )

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh an expired access token

        Args:
            refresh_token: OAuth refresh token

        Returns:
            Dict with new access_token and refresh_token
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.token_url,
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": refresh_token,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret
                    },
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Failed to refresh token: {response.text}"
                    )

                return response.json()

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"HTTP error during token refresh: {str(e)}"
                )


# Global instance
riot_auth_service = RiotAuthService()
