import pandas as pd
from itertools import combinations

# =========================
# 1. 데이터 불러오기
# =========================

df = pd.read_csv("data/savant_2023_2025.csv")

SUPPORTED_PITCHES = ["FF", "SI", "FC", "SL", "ST", "CU", "KC", "CH", "FS"]

data = df[
    [
        "player_id",
        "player_name",
        "season",
        "pitch_type",
        "pitches",
        "total_pitches",
        "pitch_percent",
        "velocity",
    ]
].copy()

data = data[data["pitch_type"].isin(SUPPORTED_PITCHES)].copy()


# =========================
# 2. 선수 레퍼토리 생성
# =========================

def get_pitcher_repertoire(player_name, threshold=3):
    pitcher = data[
        (data["player_name"] == player_name)
        & (data["pitch_percent"] >= threshold)
    ].copy()

    repertoire = {}

    for _, row in pitcher.iterrows():
        repertoire[row["pitch_type"]] = {
            "usage": row["pitch_percent"],
            "velocity": row["velocity"],
        }

    return repertoire


# =========================
# 3. A: 구종 구성 유사도
# =========================

def arsenal_similarity(pitches1, pitches2):
    set1 = set(pitches1)
    set2 = set(pitches2)

    common = set1 & set2
    total = set1 | set2

    if len(total) == 0:
        return 0

    score = len(common) / len(total)

    return score


# =========================
# 4. 사용률 정규화
# =========================

def normalize_usage(usage):
    total = sum(usage.values())

    if total == 0:
        return usage

    normalized = {}

    for pitch, value in usage.items():
        normalized[pitch] = (value / total) * 100

    return normalized


# =========================
# 5. U: 사용률 유사도
# =========================

def usage_similarity(usage1, usage2):
    all_pitches = set(usage1.keys()) | set(usage2.keys())

    total_difference = 0

    for pitch in all_pitches:
        usage_value1 = usage1.get(pitch, 0)
        usage_value2 = usage2.get(pitch, 0)

        difference = abs(usage_value1 - usage_value2)

        total_difference += difference

    score = 1 - (total_difference / 200)

    return score


# =========================
# 6. 상대 구속 차이 계산
# =========================

def calculate_velocity_gaps(repertoire):
    if not repertoire:
        return {}

    primary_pitch = max(
        repertoire,
        key=lambda pitch: repertoire[pitch]["usage"]
    )

    primary_velocity = repertoire[primary_pitch]["velocity"]

    gaps = {}

    for pitch, info in repertoire.items():
        gaps[pitch] = info["velocity"] - primary_velocity

    return gaps

# =========================
# 7. 구종 쌍 상대 구속 차이
# =========================

def calculate_pairwise_velocity_gaps(repertoire):
    gaps = {}

    pitches = sorted(repertoire.keys())

    for pitch1, pitch2 in combinations(pitches, 2):
        velocity1 = repertoire[pitch1]["velocity"]
        velocity2 = repertoire[pitch2]["velocity"]

        gap = abs(velocity1 - velocity2)

        pair = (pitch1, pitch2)

        gaps[pair] = gap

    return gaps

# =========================
# 8. 구속 구조 차이 계산
# =========================

def velocity_gap_difference(gaps1, gaps2):
    common_pairs = set(gaps1.keys()) & set(gaps2.keys())

    if len(common_pairs) == 0:
        return None, 0

    total_difference = 0

    for pair in common_pairs:
        difference = abs(gaps1[pair] - gaps2[pair])
        total_difference += difference

    mean_difference = total_difference / len(common_pairs)

    return mean_difference, len(common_pairs)


# =========================
# 9. 테스트
# =========================

if __name__ == "__main__":

    # A 테스트
    user_pitches = ["FF", "SL", "CH"]
    mlb_pitches = ["FF", "SL", "CH", "SI"]

    a_score = arsenal_similarity(user_pitches, mlb_pitches)

    print("===== Arsenal Similarity 테스트 =====")
    print("사용자 구종:", user_pitches)
    print("MLB 구종:", mlb_pitches)
    print("A 점수:", round(a_score * 100, 1))

    # U 테스트
    user_usage = {"FF": 55, "SL": 30, "CH": 15}
    mlb_usage = {"FF": 56, "SL": 29, "CH": 15}

    u_score = usage_similarity(user_usage, mlb_usage)

    print("\n===== Usage Similarity 테스트 =====")
    print("사용자:", user_usage)
    print("MLB:", mlb_usage)
    print("U 점수:", round(u_score * 100, 1))

    # 사용률 정규화 테스트
    test_usage = {"FF": 55, "SL": 28, "CH": 15}

    normalized = normalize_usage(test_usage)

    print("\n===== 사용률 정규화 테스트 =====")
    print("정규화 전:", test_usage)
    print("정규화 전 합계:", sum(test_usage.values()))

    print("정규화 후:")
    for pitch, usage in normalized.items():
        print(pitch, round(usage, 2))

    print("정규화 후 합계:", round(sum(normalized.values()), 2))

    # 상대 구속 차이 테스트
    test_repertoire = {
        "FF": {
            "usage": 55,
            "velocity": 140
        },
        "SL": {
            "usage": 30,
            "velocity": 125
        },
        "CH": {
            "usage": 15,
            "velocity": 120
        }
    }

    velocity_gaps = calculate_velocity_gaps(test_repertoire)

    print("\n===== 상대 구속 차이 테스트 =====")

    for pitch, gap in velocity_gaps.items():
        print(pitch, gap)

    # 구종 쌍 구속 차이 테스트
    pairwise_gaps = calculate_pairwise_velocity_gaps(
        test_repertoire
    )

    print("\n===== 구종 쌍 구속 차이 테스트 =====")

    for pair, gap in pairwise_gaps.items():
        print(pair, round(gap, 1))

    