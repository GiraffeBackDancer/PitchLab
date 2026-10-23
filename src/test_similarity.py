from similarity import find_similar_pitchers


USER_REPERTOIRE = {
    "FF": {
        "usage": 55,
        "velocity": 140,
    },
    "SL": {
        "usage": 30,
        "velocity": 125,
    },
    "CH": {
        "usage": 15,
        "velocity": 120,
    },
}


results = find_similar_pitchers(
    USER_REPERTOIRE,
    top_n=5,
)


for rank, pitcher in enumerate(results, start=1):
    print(f"\n===== {rank}위 =====")
    print("선수:", pitcher["player_name"])
    print("구종:", pitcher["pitches"])
    print("A:", pitcher["A_score"])
    print("U:", pitcher["U_score"])
    print("V:", pitcher["V_score"])
    print(
        "구속 구조 차이:",
        pitcher["velocity_difference"],
    )