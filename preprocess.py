import pandas as pd

df = pd.read_csv("data/savant_2024.csv")

columns = [
    "player_id",
    "player_name",
    "pitch_type",
    "pitches",
    "total_pitches",
    "pitch_percent",
    "velocity"
]

data = df[columns].copy()

SUPPORTED_PITCHES = [
    "FF",  # 포심
    "SI",  # 싱커
    "FC",  # 커터
    "SL",  # 슬라이더
    "ST",  # 스위퍼
    "CU",  # 커브
    "KC",  # 너클커브
    "CH",  # 체인지업
    "FS"   # 스플리터
]

data = data[data["pitch_type"].isin(SUPPORTED_PITCHES)].copy()

print("원본 데이터:", df.shape)
print("지원 구종 필터링 후:", data.shape)

print("\n구종별 행 개수:")
print(data["pitch_type"].value_counts())

print("\n투수 수:")
print(data["player_id"].nunique())

print("\nDylan Cease 레퍼토리:")
print(
    data[data["player_name"] == "Cease, Dylan"][
        ["pitch_type", "pitches", "pitch_percent", "velocity"]
    ]
)