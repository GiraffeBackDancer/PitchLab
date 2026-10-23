import pandas as pd

df = pd.read_csv("data/savant_2024.csv")

print("데이터 크기:", df.shape)

columns = [
    "player_id",
    "player_name",
    "pitch_type",
    "pitches",
    "total_pitches",
    "pitch_percent",
    "velocity",
]

print(df[columns].head(10))
