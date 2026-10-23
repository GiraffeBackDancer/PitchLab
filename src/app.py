from pathlib import Path
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

from similarity import find_similar_pitchers

BASE_DIR = Path(__file__).resolve().parent.parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)

CORS(app)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/similar", methods=["POST"])
def similar_pitchers():
    user_repertoire = request.get_json()

    if not user_repertoire:
        return jsonify({"error": "투구 정보를 입력해주세요."}), 400

    results = find_similar_pitchers(
        user_repertoire,
        top_n=5,
    )

    return jsonify({"results": results})


from features import data


@app.route("/api/pitcher/<int:player_id>/seasons", methods=["GET"])
def pitcher_seasons(player_id):

    pitcher_data = data[data["player_id"] == player_id].copy()

    if pitcher_data.empty:
        return jsonify({"error": "투수 데이터를 찾을 수 없습니다."}), 404

    seasons = []

    for season, season_data in pitcher_data.groupby("season"):

        pitches = []

        for _, row in season_data.iterrows():
            pitches.append(
                {
                    "pitch_type": row["pitch_type"],
                    "usage": round(float(row["pitch_percent"]), 1),
                    "velocity": round(float(row["velocity"]) * 1.609344, 1),
                }
            )

        seasons.append({"season": int(season), "pitches": pitches})

    return jsonify(
        {
            "player_id": player_id,
            "player_name": pitcher_data["player_name"].iloc[0],
            "seasons": seasons,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
