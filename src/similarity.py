import pandas as pd
from features import (
    data,
    arsenal_similarity,
    usage_similarity,
    normalize_usage,
    calculate_pairwise_velocity_gaps,
    velocity_gap_difference,
)


def find_similar_pitchers(user_repertoire, top_n=5, min_usage=3, min_pitches=500):
    user_pitches = list(user_repertoire.keys())

    user_usage = {pitch: info["usage"] for pitch, info in user_repertoire.items()}

    user_pairwise_gaps = calculate_pairwise_velocity_gaps(user_repertoire)

    results = []
    for (player_id, season), season_data in data.groupby(["player_id", "season"]):

        pitcher = season_data[
        season_data["pitch_percent"] >= min_usage
        ].copy()
        if pitcher.empty:
            continue

        total_pitches = pitcher["total_pitches"].iloc[0]

        if total_pitches < min_pitches:
            continue

        player_name = pitcher["player_name"].iloc[0]
        mlb_pitches = pitcher["pitch_type"].tolist()

        mlb_usage = {
            row["pitch_type"]: row["pitch_percent"] for _, row in pitcher.iterrows()
        }

        mlb_usage = normalize_usage(mlb_usage)

        a_score = arsenal_similarity(
            user_pitches,
            mlb_pitches,
        )

        u_score = usage_similarity(
            user_usage,
            mlb_usage,
        )

        mlb_repertoire = {}

        for _, row in pitcher.iterrows():
            mlb_repertoire[row["pitch_type"]] = {
                "usage": row["pitch_percent"],
                "velocity": row["velocity"] * 1.609344,
            }

        mlb_pairwise_gaps = calculate_pairwise_velocity_gaps(mlb_repertoire)

        velocity_difference, common_pair_count = velocity_gap_difference(
            user_pairwise_gaps,
            mlb_pairwise_gaps,
        )

        if common_pair_count < 3:
            velocity_difference = None

        pitch_details = []

        for _, row in pitcher.iterrows():
            pitch_details.append(
                {
                    "pitch": row["pitch_type"],
                    "usage": round(float(row["pitch_percent"]), 1),
                    "velocity": round(float(row["velocity"]) * 1.609344, 1),
                }
            )

        results.append(
            {
                "player_id": int(player_id),
                "player_name": player_name,
                "season": int(season),
                "total_pitches": int(total_pitches),
                "pitches": mlb_pitches,
                "pitch_details": pitch_details,
                "A_score": round(a_score * 100, 1),
                "U_score": round(u_score * 100, 1),
                "velocity_difference": (
                    round(velocity_difference, 2)
                    if velocity_difference is not None
                    else None
                ),
                "common_pair_count": common_pair_count,
            }
        )

        velocity_series = pd.Series(
            [result["velocity_difference"] for result in results],
            dtype="float64",
        )
    if not results:
        return []

    velocity_series = pd.Series(
        [result["velocity_difference"] for result in results],
        dtype="float64",
    )
    
    v_scores = (
        velocity_series.rank(
            method="average",
            ascending=False,
            pct=True,
        )
        * 100
    )

    for result, v_score in zip(results, v_scores):
        if result["velocity_difference"] is None:
            result["V_score"] = None
            continue

        result["V_score"] = round(
            float(v_score),
            1,
        )

    results.sort(
        key=lambda result: (
            result["A_score"],
            result["U_score"],
        ),
        reverse=True,
    )

    unique_results = []
    seen_players = set()

    for result in results:
        player_id = result["player_id"]

        if player_id in seen_players:
            continue

        seen_players.add(player_id)
        unique_results.append(result)

        if len(unique_results) == top_n:
            break

    return unique_results
