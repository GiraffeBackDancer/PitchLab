import pandas as pd

from features import (
    data,
    arsenal_similarity,
    usage_similarity,
    normalize_usage,
    calculate_velocity_gaps,
    calculate_pairwise_velocity_gaps,
    velocity_gap_difference,
)

USER_REPERTOIRE = {
    "FF": {"usage": 55, "velocity": 140},
    "SL": {"usage": 30, "velocity": 125},
    "CH": {"usage": 15, "velocity": 120},
}


user_pitches = list(USER_REPERTOIRE.keys())

user_usage = {pitch: info["usage"] for pitch, info in USER_REPERTOIRE.items()}


results = []

player_ids = data["player_id"].unique()

user_pairwise_gaps = calculate_pairwise_velocity_gaps(USER_REPERTOIRE)

for player_id in player_ids:

    pitcher = data[
        (data["player_id"] == player_id) & (data["pitch_percent"] >= 3)
    ].copy()

    if pitcher.empty:
        continue

    total_pitches = pitcher["total_pitches"].iloc[0]

    if total_pitches < 500:
        continue

    player_name = pitcher["player_name"].iloc[0]

    mlb_pitches = pitcher["pitch_type"].tolist()

    mlb_usage = {
        row["pitch_type"]: row["pitch_percent"] for _, row in pitcher.iterrows()
    }

    mlb_usage = normalize_usage(mlb_usage)

    mlb_repertoire = {}

    for _, row in pitcher.iterrows():
        mlb_repertoire[row["pitch_type"]] = {
            "usage": row["pitch_percent"],
            "velocity": row["velocity"] * 1.609344,
        }

    mlb_pairwise_gaps = calculate_pairwise_velocity_gaps(mlb_repertoire)

    velocity_difference, common_pair_count = velocity_gap_difference(
    user_pairwise_gaps,
    mlb_pairwise_gaps
    )

    if common_pair_count < 3:
        velocity_difference = None

    a_score = arsenal_similarity(user_pitches, mlb_pitches)

    u_score = usage_similarity(user_usage, mlb_usage)

    results.append(
        {
            "player_id": player_id,
            "player_name": player_name,
            "total_pitches": int(pitcher["total_pitches"].iloc[0]),
            "pitches": mlb_pitches,
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

results_df = pd.DataFrame(results)
valid_velocity = results_df["velocity_difference"].notna()

results_df.loc[valid_velocity, "V_score"] = (
    results_df.loc[valid_velocity, "velocity_difference"]
    .rank(method="average", ascending=False, pct=True)
    * 100
)

print("\n===== V 점수 확인 =====")
print(
    results_df[
        ["player_name", "velocity_difference", "V_score"]
    ]
    .dropna()
    .sort_values("velocity_difference")
    .head(10)
    .to_string(index=False)
)

print("\n===== Keegan Akin V 점수 확인 =====")
print(
    results_df.loc[
        results_df["player_name"] == "Akin, Keegan",
        [
            "player_name",
            "velocity_difference",
            "common_pair_count",
            "V_score",
        ],
    ].to_string(index=False)
)

print("\n===== 1단계: A + U 상위 20명 =====")

stage1 = results_df.copy()

stage1["AU_score"] = (
    stage1["A_score"] + stage1["U_score"]
) / 2

stage1 = stage1.sort_values(
    "AU_score",
    ascending=False
).head(20)

print(
    stage1[
        [
            "player_name",
            "pitches",
            "A_score",
            "U_score",
            "AU_score",
            "common_pair_count",
            "velocity_difference",
            "V_score",
        ]
    ].to_string(index=False)
)

print("\n===== 2단계: A + U 상위 20명 중 V 비교 가능 =====")

stage2 = stage1[
    stage1["V_score"].notna()
].copy()

stage2 = stage2.sort_values(
    "V_score",
    ascending=False
)

print(
    stage2[
        [
            "player_name",
            "pitches",
            "A_score",
            "U_score",
            "AU_score",
            "velocity_difference",
            "V_score",
        ]
    ].to_string(index=False)
)

print("\n===== 가중치 민감도 분석 =====")

weight_tests = {
    "균등": (1 / 3, 1 / 3, 1 / 3),
    "A 중심": (0.5, 0.3, 0.2),
    "U 중심": (0.3, 0.5, 0.2),
    "V 중심": (0.3, 0.2, 0.5),
}

sensitivity_data = results_df[
    results_df["V_score"].notna()
].copy()

for test_name, (w_a, w_u, w_v) in weight_tests.items():

    score_column = f"{test_name}_score"

    sensitivity_data[score_column] = (
        sensitivity_data["A_score"] * w_a
        + sensitivity_data["U_score"] * w_u
        + sensitivity_data["V_score"] * w_v
    )

    top5 = sensitivity_data.sort_values(
        score_column,
        ascending=False
    ).head(5)

    print(f"\n--- {test_name} ---")

    print(
        top5[
            [
                "player_name",
                "A_score",
                "U_score",
                "V_score",
                score_column,
            ]
        ].to_string(index=False)
    )

results_df["V_score"] = results_df["V_score"].round(1)
print("\n===== 전체 투수 구속 구조 차이 분포 =====")
print(results_df["velocity_difference"].describe())

print("\n===== 구속 구조 차이가 작은 투수 10명 =====")
print(
    results_df[["player_name", "pitches", "A_score", "U_score", "velocity_difference"]]
    .sort_values("velocity_difference")
    .head(10)
    .to_string(index=False)
)

print("\n===== 비교 구종 쌍 개수 분포 =====")
print(
    results_df["common_pair_count"]
    .value_counts()
    .sort_index()
)

print("\n===== 비교 구종 쌍 개수별 구속 구조 차이 =====")
print(
    results_df.groupby("common_pair_count")["velocity_difference"]
    .agg(["count", "mean", "median", "min", "max"])
)

results_df = results_df.sort_values(by=["A_score", "U_score"], ascending=False)


print("===== A + U 실제 MLB 비교 =====")

print(results_df.head(10).to_string(index=False))

print("\n===== MLB 투수 총 투구 수 분포 =====")

pitcher_totals = data.groupby("player_id")["total_pitches"].max()

print(pitcher_totals.describe())

print("\n기준별 투수 수")

for cutoff in [50, 100, 200, 300, 500, 1000]:
    count = (pitcher_totals >= cutoff).sum()

    print(
        f"{cutoff}구 이상: " f"{count}명 " f"({count / len(pitcher_totals) * 100:.1f}%)"
    )

print("\n===== 사용자 vs Keegan Akin 상대 구속 차이 =====")

user_gaps = calculate_velocity_gaps(USER_REPERTOIRE)

akin_data = data[
    (data["player_name"] == "Akin, Keegan") & (data["pitch_percent"] >= 3)
].copy()

akin_repertoire = {}

for _, row in akin_data.iterrows():
    akin_repertoire[row["pitch_type"]] = {
        "usage": row["pitch_percent"],
        "velocity": row["velocity"],
    }

akin_gaps = calculate_velocity_gaps(akin_repertoire)

print("\n사용자:")
for pitch, gap in user_gaps.items():
    print(pitch, round(gap, 1), "km/h")

print("\nKeegan Akin:")
for pitch, gap in akin_gaps.items():
    print(pitch, round(gap, 1), "mph")

print("\n===== 500구 이상 투수 Primary Pitch 분포 =====")

primary_counts = {}

for player_id in player_ids:

    pitcher = data[
        (data["player_id"] == player_id) & (data["pitch_percent"] >= 3)
    ].copy()

    if pitcher.empty:
        continue

    total_pitches = pitcher["total_pitches"].iloc[0]

    if total_pitches < 500:
        continue

    primary_row = pitcher.loc[pitcher["pitch_percent"].idxmax()]

    primary_pitch = primary_row["pitch_type"]

    primary_counts[primary_pitch] = primary_counts.get(primary_pitch, 0) + 1

primary_df = pd.DataFrame(list(primary_counts.items()), columns=["pitch_type", "count"])

primary_df = primary_df.sort_values("count", ascending=False)

primary_df["percent"] = primary_df["count"] / primary_df["count"].sum() * 100

print(primary_df.to_string(index=False))

print("\n===== 사용자 vs Keegan Akin 구종 쌍 구속 차이 =====")

# 사용자
user_pairwise_gaps = calculate_pairwise_velocity_gaps(USER_REPERTOIRE)

# Keegan Akin
akin_data = data[
    (data["player_name"] == "Akin, Keegan") & (data["pitch_percent"] >= 3)
].copy()

akin_repertoire_kmh = {}

for _, row in akin_data.iterrows():
    akin_repertoire_kmh[row["pitch_type"]] = {
        "usage": row["pitch_percent"],
        "velocity": row["velocity"] * 1.609344,
    }

akin_pairwise_gaps = calculate_pairwise_velocity_gaps(akin_repertoire_kmh)

print("\n사용자:")
for pair, gap in user_pairwise_gaps.items():
    print(pair, round(gap, 1), "km/h")

print("\nKeegan Akin:")
for pair, gap in akin_pairwise_gaps.items():
    print(pair, round(gap, 1), "km/h")

gap_difference, common_pair_count = velocity_gap_difference(
    user_pairwise_gaps,
    akin_pairwise_gaps
)

print("\n평균 구속 구조 차이:")
print(round(gap_difference, 2), "km/h")
print("비교한 구종 쌍:", common_pair_count, "개")
