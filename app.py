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
        return jsonify(
            {
                "error": "투구 정보를 입력해주세요."
            }
        ), 400

    results = find_similar_pitchers(
        user_repertoire,
        top_n=5,
    )

    return jsonify(
        {
            "results": results
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
