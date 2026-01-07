"""
Analytics module - Adapts the Python script to work as an API service
"""
import json
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend for server
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import Dict, List, Any
import math
from io import BytesIO
from PIL import Image

class ScrimAnalytics:
    """Process and analyze League of Legends scrim data"""

    def __init__(self, data_file: Path, team_riot_ids: List[str] = None):
        self.data_file = Path(data_file)
        self.team_riot_ids = team_riot_ids or []  # RIOT IDs to filter (e.g., ["Player#TAG"])
        self.export_dir = Path(__file__).parent.parent / "exports"
        self.charts_dir = self.export_dir / "charts"
        self.charts_dir.mkdir(parents=True, exist_ok=True)

        # Load data
        with open(self.data_file, 'r', encoding='utf-8') as f:
            self.raw_data = json.load(f)

        # Detect data format and normalize
        self._normalize_data()

        # Configure matplotlib
        self._setup_plotting()

    def _normalize_data(self):
        """Detect and normalize different JSON formats"""
        # If already has 'players', it's in the expected format
        if 'players' in self.raw_data:
            return

        # If has 'matches' (Riot API format), parse it
        if 'matches' in self.raw_data:
            self.raw_data['players'] = self._parse_riot_api_matches(self.raw_data['matches'])
            return

        # Unknown format
        self.raw_data['players'] = []

    def _parse_riot_api_matches(self, matches: List[Dict]) -> List[Dict]:
        """Parse Riot API matches format into players analytics format"""
        from collections import defaultdict
        import random

        # Track stats per player (by RIOT ID or PUUID for opponents)
        players_data = defaultdict(lambda: {
            "games": 0,
            "wins": 0,
            "losses": 0,
            "totals": defaultdict(int),
            "champions": defaultdict(lambda: {
                "games": 0,
                "wins": 0,
                "kills": 0,
                "deaths": 0,
                "assists": 0,
                "damage": 0
            }),
            "summoner_name": "",
            "riot_id": "",
            "position": "",
            "total_game_time": 0,
            "total_team_kills": 0,  # For KP calculation
            "is_team_member": False  # Track if player is in our team
        })

        # Counter for anonymized opponents
        opponent_counter = {}

        # Process each match
        for match in matches:
            if "info" not in match or "participants" not in match["info"]:
                continue

            game_duration_minutes = match["info"].get("gameDuration", 0) / 60.0
            participants = match["info"]["participants"]

            # Calculate team kills per team (100 vs 200)
            team_kills = {100: 0, 200: 0}
            for p in participants:
                team_id = p.get("teamId", 0)
                team_kills[team_id] += p.get("kills", 0)

            for participant in participants:
                # Build RIOT ID
                riot_game_name = participant.get("riotIdGameName", "")
                riot_tagline = participant.get("riotIdTagline", "")
                riot_id = f"{riot_game_name}#{riot_tagline}" if riot_game_name and riot_tagline else ""

                puuid = participant.get("puuid", "")

                # Check if this is a team member
                is_team = riot_id in self.team_riot_ids if self.team_riot_ids else True

                # Use RIOT ID for team members, PUUID for opponents
                player_key = riot_id if is_team else puuid

                # Skip if no valid key
                if not player_key:
                    continue

                player = players_data[player_key]
                player["is_team_member"] = is_team

                # Basic info (use most recent)
                player["summoner_name"] = participant.get("summonerName", riot_game_name or "Unknown")
                player["riot_id"] = riot_id
                player["position"] = participant.get("teamPosition",
                    participant.get("individualPosition", "UNKNOWN"))

                # Game count
                player["games"] += 1

                # Win/Loss
                if participant.get("win", False):
                    player["wins"] += 1
                else:
                    player["losses"] += 1

                # Get player's team kills for KP
                team_id = participant.get("teamId", 0)
                player_team_kills = team_kills.get(team_id, 1)  # Avoid division by zero

                # Totals
                kills = participant.get("kills", 0)
                deaths = participant.get("deaths", 0)
                assists = participant.get("assists", 0)

                player["totals"]["kills"] += kills
                player["totals"]["deaths"] += deaths
                player["totals"]["assists"] += assists
                player["totals"]["damage"] += participant.get("totalDamageDealtToChampions", 0)
                player["totals"]["gold"] += participant.get("goldEarned", 0)
                player["totals"]["cs"] += (participant.get("totalMinionsKilled", 0) +
                                          participant.get("neutralMinionsKilled", 0))
                player["totals"]["vision_score"] += participant.get("visionScore", 0)
                player["totals"]["wards_placed"] += participant.get("wardsPlaced", 0)
                player["totals"]["wards_destroyed"] += participant.get("wardsKilled", 0)
                player["totals"]["damage_to_objectives"] += participant.get("damageDealtToObjectives", 0)
                player["totals"]["damage_to_buildings"] += participant.get("damageDealtToBuildings", 0)

                # Track team kills for KP calculation
                player["total_team_kills"] += player_team_kills

                # Track game time
                player["total_game_time"] += game_duration_minutes

                # Champion stats
                champion_name = participant.get("championName", "Unknown")
                champ = player["champions"][champion_name]
                champ["games"] += 1
                if participant.get("win", False):
                    champ["wins"] += 1
                champ["kills"] += kills
                champ["deaths"] += deaths
                champ["assists"] += assists
                champ["damage"] += participant.get("totalDamageDealtToChampions", 0)

        # Convert to analytics format
        result = []
        opponent_id_map = {}  # Map puuid to anonymized name
        opponent_counter = 100  # Start at 100 for anonymized IDs

        for player_key, data in players_data.items():
            games = data["games"]
            if games == 0:
                continue

            total_game_time = data["total_game_time"] if data["total_game_time"] > 0 else games

            # Calculate Kill Participation: (Kills + Assists) / Team Kills
            total_participation = data["totals"]["kills"] + data["totals"]["assists"]
            total_team_kills = data["total_team_kills"]
            kp_percentage = (total_participation / total_team_kills * 100) if total_team_kills > 0 else 0

            # Anonymize opponents
            is_team = data["is_team_member"]
            if is_team:
                display_name = data["summoner_name"]
            else:
                # Generate consistent anonymized name for this opponent
                if player_key not in opponent_id_map:
                    opponent_id_map[player_key] = f"Unknown#{opponent_counter}"
                    opponent_counter += 1
                display_name = opponent_id_map[player_key]

            analytics_player = {
                "summoner_name": display_name,
                "position": data["position"],
                "games": games,
                "wins": data["wins"],
                "losses": data["losses"],
                "winrate": round((data["wins"] / games) * 100, 1) if games > 0 else 0,
                "is_team_member": is_team,  # Flag for frontend coloring
                "totals": {
                    "kills": data["totals"]["kills"],
                    "deaths": data["totals"]["deaths"],
                    "assists": data["totals"]["assists"],
                    "damage": data["totals"]["damage"],
                    "gold": data["totals"]["gold"],
                    "cs": data["totals"]["cs"],
                    "vision_score": data["totals"]["vision_score"],
                    "wards_placed": data["totals"]["wards_placed"],
                    "wards_destroyed": data["totals"]["wards_destroyed"],
                    "damage_to_objectives": data["totals"]["damage_to_objectives"],
                    "damage_to_buildings": data["totals"]["damage_to_buildings"]
                },
                "averages": {
                    "kills": round(data["totals"]["kills"] / games, 1),
                    "deaths": round(data["totals"]["deaths"] / games, 1),
                    "assists": round(data["totals"]["assists"] / games, 1),
                    "kill_participation": round(kp_percentage, 1),
                    "damage_per_min": round(data["totals"]["damage"] / total_game_time, 1),
                    "gold_per_min": round(data["totals"]["gold"] / total_game_time, 1),
                    "cs_per_min": round(data["totals"]["cs"] / total_game_time, 1),
                    "vision_per_game": round(data["totals"]["vision_score"] / games, 1),
                    "wards_placed_per_game": round(data["totals"]["wards_placed"] / games, 1),
                    "wards_destroyed_per_game": round(data["totals"]["wards_destroyed"] / games, 1),
                    "damage_to_objectives_per_min": round(data["totals"]["damage_to_objectives"] / total_game_time, 1),
                    "damage_to_buildings_per_min": round(data["totals"]["damage_to_buildings"] / total_game_time, 1)
                },
                "champions": []
            }

            # Add champion stats
            for champ_name, champ_data in data["champions"].items():
                champ_games = champ_data["games"]
                analytics_player["champions"].append({
                    "name": champ_name,
                    "games": champ_games,
                    "wins": champ_data["wins"],
                    "losses": champ_games - champ_data["wins"],
                    "winrate": round((champ_data["wins"] / champ_games) * 100, 1) if champ_games > 0 else 0,
                    "avg_kills": round(champ_data["kills"] / champ_games, 1) if champ_games > 0 else 0,
                    "avg_deaths": round(champ_data["deaths"] / champ_games, 1) if champ_games > 0 else 0,
                    "avg_assists": round(champ_data["assists"] / champ_games, 1) if champ_games > 0 else 0,
                    "avg_damage": round(champ_data["damage"] / champ_games, 1) if champ_games > 0 else 0
                })

            # Sort champions by games played
            analytics_player["champions"].sort(key=lambda x: x["games"], reverse=True)

            result.append(analytics_player)

        # Sort players by position (standard LoL order)
        position_order = {"TOP": 1, "JUNGLE": 2, "MIDDLE": 3, "BOTTOM": 4, "UTILITY": 5, "UNKNOWN": 6}
        result.sort(key=lambda x: position_order.get(x["position"], 6))

        # Store both: all players and team-only players
        self.all_players = result
        self.team_players = [p for p in result if p.get("is_team_member", False)]

        return self.team_players

    def _setup_plotting(self):
        """Configure matplotlib style"""
        plt.style.use('default')
        plt.rcParams['font.family'] = 'sans-serif'
        plt.rcParams['font.size'] = 11
        plt.rcParams['figure.facecolor'] = 'white'
        plt.rcParams['axes.facecolor'] = 'white'
        plt.rcParams['axes.grid'] = True
        plt.rcParams['grid.alpha'] = 0.3

    def _expand_players(self, players: List[Dict]) -> pd.DataFrame:
        """Convert players data to DataFrame"""
        rows = []
        for p in players:
            # Calculate KDA: (Kills + Assists) / Deaths (avoid division by zero)
            totals = p.get("totals", {})
            kills = totals.get("kills", 0)
            deaths = totals.get("deaths", 0)
            assists = totals.get("assists", 0)
            kda = round((kills + assists) / deaths, 1) if deaths > 0 else round(kills + assists, 1)

            base = {
                "name": p.get("summoner_name"),  # Changed from "name" to "summoner_name"
                "position": p.get("position"),
                "games_played": p.get("games"),  # Changed from "games_played" to "games"
                "wins": p.get("wins"),
                "losses": p.get("losses"),
                "winrate": p.get("winrate"),
                "kda": kda,  # Calculate KDA from totals
            }

            # Handle totals
            if "totals" in p:
                for stat_name, stat_value in p["totals"].items():
                    base[f"total_{stat_name}"] = stat_value

            # Handle averages - using the actual field names from JSON
            if "averages" in p:
                averages = p["averages"]
                base["avg_kills"] = averages.get("kills")
                base["avg_deaths"] = averages.get("deaths")
                base["avg_assists"] = averages.get("assists")
                base["avg_kill_participation"] = averages.get("kill_participation")
                base["per_min_damage"] = averages.get("damage_per_min")
                base["per_min_gold"] = averages.get("gold_per_min")
                base["per_min_cs"] = averages.get("cs_per_min")
                base["avg_vision"] = averages.get("vision_per_game")
                base["avg_wards_placed"] = averages.get("wards_placed_per_game")
                base["avg_wards_destroyed"] = averages.get("wards_destroyed_per_game")
                base["per_min_damage_to_objectives"] = averages.get("damage_to_objectives_per_min")
                base["per_min_damage_to_buildings"] = averages.get("damage_to_buildings_per_min")

            rows.append(base)

        return pd.DataFrame(rows)

    def _to_numeric_safe(self, df: pd.DataFrame, cols: List[str]):
        """Convert columns to numeric safely"""
        for c in cols:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors="coerce")

    def get_players_overview(self) -> Dict[str, Any]:
        """Get overview statistics - returns team players + all players for comparison"""
        team_players = self.raw_data.get("players", [])
        all_players_raw = getattr(self, 'all_players', team_players)

        # Process team players
        players_df = self._expand_players(team_players)
        numeric_cols = [
            "games_played", "wins", "losses", "winrate", "kda",
            "total_kills", "total_deaths", "total_assists",
            "avg_kill_participation", "per_min_damage", "per_min_gold", "per_min_cs"
        ]
        self._to_numeric_safe(players_df, numeric_cols)
        players_data = players_df.to_dict(orient='records')

        # Add champion stats back to team players
        for i, player_dict in enumerate(players_data):
            original_player = team_players[i]
            if "champions" in original_player:
                player_dict["champions"] = original_player["champions"]
                champ_stats = original_player["champions"]
                sorted_champs = sorted(champ_stats, key=lambda x: x.get("games", 0), reverse=True)
                player_dict["top_champions"] = sorted_champs[:5]

        # Process all players (team + opponents) with same format
        all_players_df = self._expand_players(all_players_raw)
        self._to_numeric_safe(all_players_df, numeric_cols)
        all_players_data = all_players_df.to_dict(orient='records')

        # Add champion stats and is_team_member flag to all players
        for i, player_dict in enumerate(all_players_data):
            original_player = all_players_raw[i]
            if "champions" in original_player:
                player_dict["champions"] = original_player["champions"]
                champ_stats = original_player["champions"]
                sorted_champs = sorted(champ_stats, key=lambda x: x.get("games", 0), reverse=True)
                player_dict["top_champions"] = sorted_champs[:5]
            # Add is_team_member flag
            player_dict["is_team_member"] = original_player.get("is_team_member", True)

        return {
            "players": players_data,  # Team only
            "all_players": all_players_data,  # Team + adversaires (same format as players)
            "total_players": len(players_data),
            "team_stats": {
                "avg_winrate": round(float(players_df["winrate"].mean()), 1) if "winrate" in players_df else 0,
                "avg_kda": round(float(players_df["kda"].mean()), 1) if "kda" in players_df else 0,
                "total_games": int(players_df["games_played"].sum()) if "games_played" in players_df else 0
            }
        }

    def generate_winrate_chart(self) -> str:
        """Generate winrate bar chart"""
        players = self.raw_data.get("players", [])
        players_df = self._expand_players(players)
        self._to_numeric_safe(players_df, ["winrate"])

        ordered = players_df[["name", "winrate"]].sort_values("winrate", ascending=False)

        # Convert to lists to avoid dtype issues with matplotlib
        names = [str(x) for x in ordered["name"].tolist()]
        winrates = [float(x) if pd.notna(x) else 0.0 for x in ordered["winrate"].tolist()]

        plt.figure(figsize=(10, 6))
        plt.bar(range(len(names)), winrates, color='#4ECDC4')
        plt.xticks(range(len(names)), names, rotation=45, ha="right")
        plt.ylabel("Winrate (%)")
        plt.title("Winrate par joueur")
        plt.tight_layout()

        chart_path = self.charts_dir / "winrate_by_player.png"
        plt.savefig(chart_path, dpi=200, bbox_inches="tight")
        plt.close()

        return str(chart_path)

    def generate_kda_chart(self) -> str:
        """Generate KDA comparison chart"""
        players = self.raw_data.get("players", [])
        players_df = self._expand_players(players)
        self._to_numeric_safe(players_df, ["kda", "per_min_damage"])

        # Convert to native Python types
        kda_values = [float(x) if pd.notna(x) else 0.0 for x in players_df["kda"].tolist()]
        dpm_values = [float(x) if pd.notna(x) else 0.0 for x in players_df["per_min_damage"].tolist()]
        names = [str(x) for x in players_df["name"].tolist()]

        plt.figure(figsize=(10, 6))
        plt.scatter(kda_values, dpm_values, s=100, alpha=0.6, color='#FF6B6B')

        for i, name in enumerate(names):
            plt.annotate(name, (kda_values[i], dpm_values[i]),
                        xytext=(5, 5), textcoords='offset points', fontsize=9)

        plt.xlabel("KDA")
        plt.ylabel("Damage per minute (DPM)")
        plt.title("KDA vs DPM per player")
        plt.grid(alpha=0.3)
        plt.tight_layout()

        chart_path = self.charts_dir / "kda_vs_dpm.png"
        plt.savefig(chart_path, dpi=200, bbox_inches="tight")
        plt.close()

        return str(chart_path)

    def generate_radar_players(self) -> str:
        """Generate radar chart mosaic for all players"""
        players = self.raw_data.get("players", [])

        # Helper function to calculate KDA
        def calc_kda(p):
            totals = p.get("totals", {})
            kills = totals.get("kills", 0)
            deaths = totals.get("deaths", 0)
            assists = totals.get("assists", 0)
            return (kills + assists) / deaths if deaths > 0 else kills + assists

        # Helper function to get metric value
        def get_metric(p, metric_key):
            if metric_key == "kda":
                return calc_kda(p)
            elif metric_key == "dpm":
                return p.get("averages", {}).get("damage_per_min", 0.0)
            elif metric_key == "gpm":
                return p.get("averages", {}).get("gold_per_min", 0.0)
            elif metric_key == "csm":
                return p.get("averages", {}).get("cs_per_min", 0.0)
            elif metric_key == "kp":
                return p.get("averages", {}).get("kill_participation", 0.0)
            return 0.0

        metrics = [
            ("kda", "KDA"),
            ("dpm", "DPM"),
            ("gpm", "GPM"),
            ("csm", "CSM"),
            ("kp", "KP"),
        ]

        labels = [lab for _, lab in metrics]
        raw_rows, names = [], []

        for p in players:
            names.append(p.get("summoner_name", ""))
            raw_rows.append([get_metric(p, key) for key, _ in metrics])

        raw_mat = np.array(raw_rows, dtype=float)
        mins = raw_mat.min(axis=0)
        maxs = raw_mat.max(axis=0)
        rng = np.where(maxs - mins == 0, 1.0, maxs - mins)
        norm = (raw_mat - mins) / rng
        team_avg = norm.mean(axis=0)

        # Create figure with subplots
        n_players = len(names)
        cols = min(3, n_players)
        rows = math.ceil(n_players / cols)

        fig = plt.figure(figsize=(cols * 5, rows * 5))

        for idx, (name, vals) in enumerate(zip(names, norm)):
            ax = fig.add_subplot(rows, cols, idx + 1, projection='polar')

            # Prepare data
            angles = np.linspace(0, 2 * math.pi, len(labels), endpoint=False)
            vals_plot = np.concatenate([vals, vals[:1]])
            team_plot = np.concatenate([team_avg, team_avg[:1]])
            angles_plot = np.concatenate([angles, angles[:1]])

            # Plot
            ax.plot(angles_plot, team_plot, 'o--', linewidth=1, color='gray', alpha=0.5, label='Team Avg')
            ax.plot(angles_plot, vals_plot, 'o-', linewidth=2, label=name)
            ax.fill(angles_plot, vals_plot, alpha=0.25)

            # Styling
            ax.set_xticks(angles)
            ax.set_xticklabels(labels, size=9)
            ax.set_ylim(0, 1)
            ax.set_yticks([0.25, 0.5, 0.75])
            ax.set_yticklabels(['', '', ''], size=8)
            ax.grid(True, alpha=0.3)
            ax.set_title(name, size=12, fontweight='bold', pad=20)

        plt.tight_layout()

        chart_path = self.charts_dir / "radar_players.png"
        plt.savefig(chart_path, dpi=200, bbox_inches="tight", facecolor='white')
        plt.close()

        return str(chart_path)

    def process(self) -> Dict[str, Any]:
        """Process all analytics and return results"""
        try:
            # Generate charts
            winrate_chart = self.generate_winrate_chart()
            kda_chart = self.generate_kda_chart()
            radar_chart = self.generate_radar_players()

            # Get player stats
            players_stats = self.get_players_overview()

            return {
                "success": True,
                "data": players_stats,
                "charts": {
                    "winrate": winrate_chart.replace(str(self.export_dir), "/exports"),
                    "kda": kda_chart.replace(str(self.export_dir), "/exports"),
                    "radar": radar_chart.replace(str(self.export_dir), "/exports")
                },
                "timestamp": pd.Timestamp.now().isoformat()
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
