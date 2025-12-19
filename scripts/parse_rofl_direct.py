"""
Direct .rofl parser - NO API NEEDED
Extracts all stats directly from .rofl files
"""

import json
import struct
from pathlib import Path
from typing import List, Dict, Any
from collections import defaultdict

# ==================== CONFIGURATION ====================

# Players to track (Riot IDs: gameName#tagLine)
TRACKED_PLAYERS = [
    "corsikanet#EUW",
    "NonoJ#WIN",
    "Peraste#EUW",
    "Int like Neron#NBO",
    "ωee ωoo ωee#Yuumi"
]

# ==================== ROFL PARSER ====================

def parse_rofl_file(rofl_path: Path) -> Dict[str, Any]:
    """Parse .rofl file and extract all game data"""
    try:
        with open(rofl_path, 'rb') as f:
            content = f.read()

        # Find the statsJson section (it's in the metadata)
        # Search for the JSON blob containing game data
        json_start = content.find(b'{"gameLength":')

        if json_start == -1:
            print(f"Could not find game data in {rofl_path.name}")
            return None

        # Find the end of the JSON (look for "},"gameId" pattern or end of stats)
        json_end = content.find(b',"gameId":', json_start)
        if json_end == -1:
            json_end = content.find(b'},"gameId":', json_start)

        if json_end == -1:
            # Try to find just the closing bracket
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

        # Clean up any truncated data
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            # Try to add closing bracket
            json_str = json_str.rstrip(',') + '}'
            data = json.loads(json_str)

        # Parse the statsJson array
        stats_json = json.loads(data['statsJson']) if isinstance(data['statsJson'], str) else data['statsJson']

        # Extract match info
        game_length_ms = data.get('gameLength', 0)
        game_length_min = game_length_ms / 60000

        match_data = {
            'game_length_seconds': game_length_ms / 1000,
            'game_length_minutes': game_length_min,
            'players': []
        }

        # Extract player data
        for player_stats in stats_json:
            riot_id = f"{player_stats.get('RIOT_ID_GAME_NAME', '')}#{player_stats.get('RIOT_ID_TAG_LINE', '')}"

            # Calculate per-minute stats
            kills = int(player_stats.get('CHAMPIONS_KILLED', 0))
            deaths = int(player_stats.get('NUM_DEATHS', 0))
            assists = int(player_stats.get('ASSISTS', 0))

            cs = int(player_stats.get('MINIONS_KILLED', 0)) + int(player_stats.get('NEUTRAL_MINIONS_KILLED', 0))
            gold = int(player_stats.get('GOLD_EARNED', 0))
            damage_to_champs = int(player_stats.get('TOTAL_DAMAGE_DEALT_TO_CHAMPIONS', 0))
            damage_taken = int(player_stats.get('TOTAL_DAMAGE_TAKEN', 0))

            # KDA calculation
            kda = (kills + assists) / deaths if deaths > 0 else float(kills + assists)

            player_data = {
                'summoner_name': riot_id,
                'champion': player_stats.get('SKIN', ''),
                'position': player_stats.get('TEAM_POSITION', ''),
                'team': 'BLUE' if player_stats.get('TEAM') == '100' else 'RED',
                'win': player_stats.get('WIN') == 'Win',

                # KDA
                'kills': kills,
                'deaths': deaths,
                'assists': assists,
                'kda': round(kda, 2),

                # CS & Gold
                'cs': cs,
                'cs_per_min': round(cs / game_length_min, 2) if game_length_min > 0 else 0,
                'gold_earned': gold,
                'gold_per_min': round(gold / game_length_min, 1) if game_length_min > 0 else 0,

                # Damage
                'damage_to_champions': damage_to_champs,
                'damage_taken': damage_taken,
                'damage_per_min': round(damage_to_champs / game_length_min, 1) if game_length_min > 0 else 0,
                'damage_taken_per_min': round(damage_taken / game_length_min, 1) if game_length_min > 0 else 0,

                # Vision
                'vision_score': int(player_stats.get('VISION_SCORE', 0)),
                'wards_placed': int(player_stats.get('WARD_PLACED', 0)),
                'wards_destroyed': int(player_stats.get('WARD_KILLED', 0)),
                'control_wards_placed': int(player_stats.get('WARD_PLACED_DETECTOR', 0)),

                # Objectives
                'damage_to_objectives': int(player_stats.get('TOTAL_DAMAGE_DEALT_TO_OBJECTIVES', 0)),
                'damage_to_turrets': int(player_stats.get('TOTAL_DAMAGE_DEALT_TO_TURRETS', 0)),
                'turret_kills': int(player_stats.get('TURRETS_KILLED', 0)),

                # Combat
                'killing_sprees': int(player_stats.get('KILLING_SPREES', 0)),
                'largest_killing_spree': int(player_stats.get('LARGEST_KILLING_SPREE', 0)),
                'double_kills': int(player_stats.get('DOUBLE_KILLS', 0)),
                'triple_kills': int(player_stats.get('TRIPLE_KILLS', 0)),
                'quadra_kills': int(player_stats.get('QUADRA_KILLS', 0)),
                'penta_kills': int(player_stats.get('PENTA_KILLS', 0)),

                # CC
                'time_ccing_others': int(player_stats.get('TIME_CCING_OTHERS', 0)),

                # Healing/Shielding
                'total_heal': int(player_stats.get('TOTAL_HEAL', 0)),
                'total_heal_on_teammates': int(player_stats.get('TOTAL_HEAL_ON_TEAMMATES', 0)),
                'damage_self_mitigated': int(player_stats.get('TOTAL_DAMAGE_SELF_MITIGATED', 0)),
                'damage_shielded_on_teammates': int(player_stats.get('TOTAL_DAMAGE_SHIELDED_ON_TEAMMATES', 0)),

                # Items
                'items': [
                    int(player_stats.get(f'ITEM{i}', 0))
                    for i in range(7)
                ],

                # Misc
                'level': int(player_stats.get('LEVEL', 0)),
                'time_played_seconds': int(player_stats.get('TIME_PLAYED', 0)),
                'time_spent_dead': int(player_stats.get('TOTAL_TIME_SPENT_DEAD', 0)),

                # Damage breakdown
                'magic_damage_to_champions': int(player_stats.get('MAGIC_DAMAGE_DEALT_TO_CHAMPIONS', 0)),
                'physical_damage_to_champions': int(player_stats.get('PHYSICAL_DAMAGE_DEALT_TO_CHAMPIONS', 0)),
                'true_damage_to_champions': int(player_stats.get('TRUE_DAMAGE_DEALT_TO_CHAMPIONS', 0)),
            }

            match_data['players'].append(player_data)

        return match_data

    except Exception as e:
        print(f"Error parsing {rofl_path.name}: {e}")
        import traceback
        traceback.print_exc()
        return None


def aggregate_scrim_matches(matches: List[Dict], scrim_name: str, tracked_players: set) -> Dict:
    """Aggregate multiple matches into scrim summary"""

    all_players = defaultdict(lambda: {
        'summoner_name': '',
        'position': '',
        'games': 0,
        'wins': 0,
        'losses': 0,
        'champions': defaultdict(lambda: {'games': 0, 'wins': 0, 'losses': 0, 'kills': 0, 'deaths': 0, 'assists': 0}),
        'totals': defaultdict(int),
        'matches': []
    })

    for match in matches:
        for player in match['players']:
            # Skip if not in tracked players
            if player['summoner_name'] not in tracked_players:
                continue

            player_id = player['summoner_name']
            player_data = all_players[player_id]

            # Basic info
            player_data['summoner_name'] = player['summoner_name']
            player_data['position'] = player['position']
            player_data['games'] += 1

            if player['win']:
                player_data['wins'] += 1
            else:
                player_data['losses'] += 1

            # Champion stats
            champ = player['champion']
            player_data['champions'][champ]['games'] += 1
            player_data['champions'][champ]['kills'] += player['kills']
            player_data['champions'][champ]['deaths'] += player['deaths']
            player_data['champions'][champ]['assists'] += player['assists']

            if player['win']:
                player_data['champions'][champ]['wins'] += 1
            else:
                player_data['champions'][champ]['losses'] += 1

            # Accumulate totals
            for key in ['kills', 'deaths', 'assists', 'cs', 'gold_earned',
                       'damage_to_champions', 'damage_taken', 'vision_score']:
                player_data['totals'][key] += player[key]

            player_data['totals']['game_time_minutes'] += match['game_length_minutes']

            # Store match
            player_data['matches'].append(player)

    # Format output
    players_output = []
    for player_id, player_data in all_players.items():
        games = player_data['games']
        totals = player_data['totals']

        # Calculate averages
        winrate = (player_data['wins'] / games * 100) if games > 0 else 0

        # Champion pool
        champions = [
            {
                'champion': champ,
                'games': stats['games'],
                'wins': stats['wins'],
                'losses': stats['losses'],
                'winrate': round((stats['wins'] / stats['games'] * 100), 1) if stats['games'] > 0 else 0,
                'kda': round((stats['kills'] + stats['assists']) / stats['deaths'], 2) if stats['deaths'] > 0 else float(stats['kills'] + stats['assists'])
            }
            for champ, stats in player_data['champions'].items()
        ]
        champions.sort(key=lambda x: x['games'], reverse=True)

        players_output.append({
            'summoner_name': player_data['summoner_name'],
            'position': player_data['position'],
            'games': games,
            'wins': player_data['wins'],
            'losses': player_data['losses'],
            'winrate': round(winrate, 2),

            'kda': round((totals['kills'] + totals['assists']) / totals['deaths'], 2) if totals['deaths'] > 0 else float(totals['kills'] + totals['assists']),
            'per_min_damage': round(totals['damage_to_champions'] / totals['game_time_minutes'], 1) if totals['game_time_minutes'] > 0 else 0,
            'per_min_gold': round(totals['gold_earned'] / totals['game_time_minutes'], 1) if totals['game_time_minutes'] > 0 else 0,

            'champions': champions,
            'games_played': games
        })

    return {
        'players': players_output
    }


def main():
    """Main execution"""
    print("=" * 60)
    print("Direct ROFL Parser - LeagueHub")
    print("=" * 60)
    print()

    base_dir = Path(__file__).parent.parent
    scrims_dir = base_dir / "Scrims"
    output_dir = scrims_dir / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    tracked_set = set(TRACKED_PLAYERS)
    print(f"Tracking {len(tracked_set)} players:")
    for p in tracked_set:
        print(f"  - {p}")
    print()

    # Find all scrim folders
    scrim_folders = sorted([d for d in scrims_dir.iterdir() if d.is_dir() and d.name.startswith('Scrim')])

    if not scrim_folders:
        print("No scrim folders found!")
        print("Create folders: Scrims/Scrim1/, Scrims/Scrim2/, etc.")
        return

    print(f"Found {len(scrim_folders)} scrim folder(s)")
    print()

    all_scrims = []

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

        matches_data = []
        for rofl_file in rofl_files:
            print(f"  Parsing {rofl_file.name}...", end=" ")
            match_data = parse_rofl_file(rofl_file)

            if match_data:
                matches_data.append(match_data)
                print("OK")
            else:
                print("FAILED")

        if not matches_data:
            print(f"  No valid matches")
            continue

        # Aggregate
        print(f"  Generating summary...")
        scrim_data = aggregate_scrim_matches(matches_data, scrim_name, tracked_set)

        # Save
        output_file = output_dir / f"{scrim_name.lower()}_data.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(scrim_data, f, indent=2, ensure_ascii=False)

        print(f"  Saved: {output_file.name}")
        print(f"  Players: {len(scrim_data['players'])}")
        print()

        all_scrims.append(scrim_data)

    # Generate global data
    if all_scrims:
        print("Generating global data...")

        # Combine all players across all scrims
        global_players = defaultdict(lambda: {
            'summoner_name': '',
            'position': '',
            'games': 0,
            'wins': 0,
            'losses': 0,
            'champions': []
        })

        for scrim in all_scrims:
            for player in scrim['players']:
                pid = player['summoner_name']
                gp = global_players[pid]

                gp['summoner_name'] = player['summoner_name']
                gp['position'] = player['position']
                gp['games'] += player['games']
                gp['wins'] += player['wins']
                gp['losses'] += player['losses']

                # Merge champions
                for champ in player['champions']:
                    gp['champions'].append(champ)

        # Format global output
        global_output = {
            'players': [
                {
                    'summoner_name': p['summoner_name'],
                    'position': p['position'],
                    'games': p['games'],
                    'wins': p['wins'],
                    'losses': p['losses'],
                    'winrate': round((p['wins'] / p['games'] * 100), 2) if p['games'] > 0 else 0,
                    'champions': p['champions']
                }
                for p in global_players.values()
            ]
        }

        global_file = output_dir / "global_data.json"
        with open(global_file, 'w', encoding='utf-8') as f:
            json.dump(global_output, f, indent=2, ensure_ascii=False)

        print(f"Saved: {global_file.name}")
        print(f"Total scrims: {len(all_scrims)}")

    print()
    print("=" * 60)
    print("DONE!")
    print("=" * 60)


if __name__ == "__main__":
    main()
