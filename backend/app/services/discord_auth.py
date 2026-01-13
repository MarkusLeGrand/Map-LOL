"""
Discord OAuth 2.0 Authentication Service
Handles the OAuth flow to authenticate users with their Discord account
"""
import os
import secrets
import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException


class DiscordAuthService:
    """Discord OAuth 2.0 service"""

    def __init__(self):
        self.client_id = os.getenv("DISCORD_CLIENT_ID", "")
        self.client_secret = os.getenv("DISCORD_CLIENT_SECRET", "")
        # Settings link callback (default)
        self.redirect_uri = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:3000/auth/discord/callback")
        # Login/Signup callback
        self.login_redirect_uri = os.getenv("DISCORD_LOGIN_REDIRECT_URI", "http://localhost:3000/auth/discord/login/callback")

        # Discord OAuth endpoints
        self.authorize_url = "https://discord.com/api/oauth2/authorize"
        self.token_url = "https://discord.com/api/oauth2/token"
        self.userinfo_url = "https://discord.com/api/users/@me"

    def get_authorization_url(self, state: Optional[str] = None, use_login_redirect: bool = False) -> Dict[str, str]:
        """
        Generate the authorization URL for Discord OAuth

        Args:
            state: Optional state parameter for CSRF protection
            use_login_redirect: If True, use login redirect URI instead of default

        Returns:
            Dict with authorization URL and state
        """
        if not state:
            state = secrets.token_urlsafe(32)

        redirect_uri = self.login_redirect_uri if use_login_redirect else self.redirect_uri

        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "identify email",
            "state": state
        }

        # Build query string
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        auth_url = f"{self.authorize_url}?{query_string}"

        return {
            "authorization_url": auth_url,
            "state": state
        }

    async def exchange_code_for_token(self, code: str, use_login_redirect: bool = False) -> Dict[str, Any]:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from Discord OAuth callback
            use_login_redirect: If True, use login redirect URI instead of default

        Returns:
            Dict with access_token, refresh_token, expires_in
        """
        redirect_uri = self.login_redirect_uri if use_login_redirect else self.redirect_uri

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.token_url,
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "redirect_uri": redirect_uri,
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
        Get user information from Discord using access token

        Args:
            access_token: OAuth access token

        Returns:
            Dict with user info (id, username, discriminator, email)
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
discord_auth_service = DiscordAuthService()
