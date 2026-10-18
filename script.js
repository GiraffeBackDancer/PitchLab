/* =========================================================
   PitchLab Frontend
   ========================================================= */

const API_URL = "/api/similar";


/* =========================================================
   구종 이름
   ========================================================= */

const PITCH_NAMES = {
    FF: "포심",
    SI: "싱커",
    FC: "커터",
    SL: "슬라이더",
    ST: "스위퍼",
    CU: "커브",
    KC: "너클커브",
    CH: "체인지업",
    FS: "스플리터"
};


/* =========================================================
   현재 입력 데이터 / 검색 결과 저장
   ========================================================= */

let currentPitchData = [];
let currentResults = [];


/* =========================================================
   초기화
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    updateUsageTotal();
    addInputListeners();
});


/* =========================================================
   입력창 이벤트
   ========================================================= */

function addInputListeners() {

    document.addEventListener("input", (event) => {

        if (
            event.target.classList.contains("usage-input") ||
            event.target.classList.contains("velocity-input")
        ) {
            updateUsageTotal();
        }
    });

    document.addEventListener("change", (event) => {

        if (event.target.classList.contains("pitch-type")) {
            preventDuplicatePitchTypes();
        }
    });
}


/* =========================================================
   사용률 계산
   ========================================================= */

function updateUsageTotal() {

    const inputs =
        document.querySelectorAll(".usage-input");

    let total = 0;

    inputs.forEach(input => {

        const value = parseFloat(input.value);

        if (!isNaN(value)) {
            total += value;
        }
    });

    total = Number(total.toFixed(1));

    const totalElement =
        document.getElementById("usage-total");

    const message =
        document.getElementById("usage-message");

    totalElement.textContent = `${total}%`;

    if (total === 100) {

        totalElement.style.color = "#2e9a62";

        message.textContent =
            "사용률 합계가 100%입니다.";

        message.className =
            "message success";

    } else {

        totalElement.style.color = "#e24e4e";

        message.textContent =
            `사용률 합계를 확인해주세요. 현재 ${total}%입니다.`;

        message.className =
            "message error";
    }

    return total;
}


/* =========================================================
   구종 추가
   ========================================================= */

function addPitchRow() {

    const container =
        document.getElementById("pitch-list");

    const row =
        document.createElement("div");

    row.className = "pitch-row";

    row.innerHTML = `
        <select class="pitch-type">

            <option value="FF">포심</option>
            <option value="SI">싱커</option>
            <option value="FC">커터</option>
            <option value="SL">슬라이더</option>
            <option value="ST">스위퍼</option>
            <option value="CU">커브</option>
            <option value="KC">너클커브</option>
            <option value="CH">체인지업</option>
            <option value="FS">스플리터</option>

        </select>

        <div class="input-with-unit">

            <input
                type="number"
                class="velocity-input"
                placeholder="평균 구속"
                min="0"
                max="200"
                step="0.1"
            >

            <span>km/h</span>

        </div>

        <div class="input-with-unit">

            <input
                type="number"
                class="usage-input"
                placeholder="사용률"
                min="0"
                max="100"
                step="0.1"
            >

            <span>%</span>

        </div>

        <button
            type="button"
            class="delete-btn"
            onclick="removePitchRow(this)"
        >
            ×
        </button>
    `;

    container.appendChild(row);

    updateUsageTotal();

    preventDuplicatePitchTypes();
}


/* =========================================================
   구종 삭제
   ========================================================= */

function removePitchRow(button) {

    const row =
        button.closest(".pitch-row");

    if (!row) {
        return;
    }

    const rows =
        document.querySelectorAll(".pitch-row");

    if (rows.length <= 1) {

        alert("최소 1개의 구종은 입력해야 합니다.");

        return;
    }

    row.remove();

    updateUsageTotal();
}


/* =========================================================
   중복 구종 체크
   ========================================================= */

function preventDuplicatePitchTypes() {

    const selects =
        document.querySelectorAll(".pitch-type");

    const used = new Set();

    selects.forEach(select => {

        const value = select.value;

        if (used.has(value)) {

            const message =
                document.getElementById("usage-message");

            message.textContent =
                "같은 구종을 중복으로 선택할 수 없습니다.";

            message.className =
                "message error";

        } else {

            used.add(value);
        }
    });
}


/* =========================================================
   입력값 수집
   ========================================================= */

function collectPitchData() {

    const rows =
        document.querySelectorAll(".pitch-row");

    const pitches = [];

    const usedTypes = new Set();

    let hasError = false;


    rows.forEach((row, index) => {

        const pitchType =
            row.querySelector(".pitch-type")?.value;

        const velocity =
            parseFloat(
                row.querySelector(".velocity-input")?.value
            );

        const usage =
            parseFloat(
                row.querySelector(".usage-input")?.value
            );


        if (usedTypes.has(pitchType)) {

            alert(
                `${PITCH_NAMES[pitchType] || pitchType}가 중복 선택되었습니다.`
            );

            hasError = true;

            return;
        }

        usedTypes.add(pitchType);


        if (
            isNaN(velocity) ||
            velocity <= 0
        ) {

            alert(
                `${index + 1}번째 구종의 평균 구속을 입력해주세요.`
            );

            hasError = true;

            return;
        }


        if (
            isNaN(usage) ||
            usage < 0 ||
            usage > 100
        ) {

            alert(
                `${index + 1}번째 구종의 사용률을 확인해주세요.`
            );

            hasError = true;

            return;
        }


        pitches.push({
            pitch_type: pitchType,
            velocity: velocity,
            usage: usage
        });

    });


    if (hasError) {
        return null;
    }

    return pitches;
}


/* =========================================================
   검색
   ========================================================= */

async function searchPitchers() {

    const total = updateUsageTotal();

    if (total !== 100) {

        alert(
            `사용률 합계를 100%로 맞춰주세요.\n현재 ${total}%입니다.`
        );

        return;
    }


    const pitches = collectPitchData();

    if (!pitches || pitches.length === 0) {

        alert("구종 정보를 입력해주세요.");

        return;
    }


    currentPitchData = pitches;


    const searchButton =
        document.getElementById("search-btn");

    searchButton.disabled = true;


    showSection("results-section");

    showLoading(true);


    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(
                    Object.fromEntries(
                        pitches.map(pitch => [
                            pitch.pitch_type,
                            {
                                velocity: pitch.velocity,
                                usage: pitch.usage
                            }
                        ])
                    )
                )
            }
        );


        if (!response.ok) {

            let errorMessage =
                `서버 오류 (${response.status})`;

            try {

                const errorData =
                    await response.json();

                if (errorData.message) {
                    errorMessage = errorData.message;
                }

                if (errorData.error) {
                    errorMessage = errorData.error;
                }

            } catch (e) {
                // JSON이 아니면 기본 오류 문구 사용
            }

            throw new Error(errorMessage);
        }


        const data =
            await response.json();

        console.log("PitchLab API 응답:", data);


        currentResults =
            normalizeResults(data);


        showLoading(false);

        renderResults(currentResults);


    } catch (error) {

        console.error("API 요청 오류:", error);

        showLoading(false);

        document.getElementById(
            "results-container"
        ).innerHTML = "";

        document.getElementById(
            "results-empty"
        ).classList.remove("hidden");

        document.getElementById(
            "results-empty"
        ).textContent =
            `검색 중 오류가 발생했습니다: ${error.message}`;

    } finally {

        searchButton.disabled = false;
    }
}


/* =========================================================
   API 응답 정리
   ========================================================= */


function normalizeResults(data) {
    const results = Array.isArray(data.results)
        ? data.results
        : [];

    return results.map((player, index) => {
        const details = player.pitch_details || [];

        const allPitches = new Set([
            ...currentPitchData.map(p => p.pitch_type),
            ...details.map(p => p.pitch)
        ]);

        const comparison = [...allPitches].map(pitchType => {
            const mine = currentPitchData.find(
                p => p.pitch_type === pitchType
            );

            const mlb = details.find(
                p => p.pitch === pitchType
            );

            return {
                pitch_type: pitchType,
                my_usage: mine?.usage ?? null,
                mlb_usage: mlb?.usage ?? null,
                my_velocity: mine?.velocity ?? null,
                mlb_velocity: mlb?.velocity ?? null
            };
        });

        return {
            index: index,
            name: player.player_name,
            pitches: player.pitches || [],
            A: player.A_score,
            U: player.U_score,
            V: player.V_score,
            pitchComparison: comparison
        };
    });
}


/* =========================================================
   숫자 변환
   ========================================================= */

function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number =
        Number(value);

    return isNaN(number)
        ? null
        : number;
}


/* =========================================================
   Top 5 출력
   ========================================================= */

function renderResults(results) {

    const container =
        document.getElementById("results-container");

    const empty =
        document.getElementById("results-empty");

    container.innerHTML = "";


    if (!results || results.length === 0) {

        empty.classList.remove("hidden");

        return;
    }


    empty.classList.add("hidden");


    results.slice(0, 5).forEach((player, index) => {

        const card =
            document.createElement("div");

        card.className =
            "player-card";


        const pitchesText =
            formatPitches(player.pitches);


        card.innerHTML = `

            <div class="player-rank">
                ${index + 1}
            </div>


            <div class="player-info">

                <h3>
                    ${escapeHtml(player.name)}
                </h3>

                <p>
                    ${escapeHtml(pitchesText)}
                </p>

            </div>


            <div class="score-summary">

                <div class="score-pill">
                    A ${formatScore(player.A)}
                </div>

                <div class="score-pill">
                    U ${formatScore(player.U)}
                </div>

                <div class="score-pill">
                    V ${formatScore(player.V)}
                </div>

            </div>


            <button
                type="button"
                class="detail-btn"
                onclick="openDetail(${index})"
            >
                상세 비교
            </button>

        `;


        container.appendChild(card);

    });
}


/* =========================================================
   구종 이름 정리
   ========================================================= */

function formatPitches(pitches) {

    if (!pitches) {
        return "-";
    }


    if (typeof pitches === "string") {
        return pitches;
    }


    if (!Array.isArray(pitches)) {
        return "-";
    }


    return pitches
        .map(pitch => {

            if (typeof pitch === "string") {

                return PITCH_NAMES[pitch] || pitch;
            }

            if (pitch && pitch.pitch_type) {

                return (
                    PITCH_NAMES[pitch.pitch_type] ||
                    pitch.pitch_type
                );
            }

            return null;

        })
        .filter(Boolean)
        .join(" / ");
}


/* =========================================================
   상세 비교
   ========================================================= */

function openDetail(index) {

    const player =
        currentResults[index];

    if (!player) {
        return;
    }


    showSection("detail-section");


    document.getElementById(
        "detail-title"
    ).textContent =
        `내 투수 vs ${player.name}`;


    renderComparisonTable(player);

    renderScores(player);


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   비교 테이블
   ========================================================= */

function renderComparisonTable(player) {

    const body =
        document.getElementById("comparison-body");

    body.innerHTML = "";


    let comparison =
        player.pitchComparison;


    /*
        서버에서 pitch_comparison이 없을 경우
        입력한 구종을 기준으로 최소한의 행을 생성합니다.
    */

    if (
        !Array.isArray(comparison) ||
        comparison.length === 0
    ) {

        comparison =
            createFallbackComparison();
    }


    comparison.forEach(row => {

        const normalized =
            normalizeComparisonRow(row);


        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${escapeHtml(normalized.pitchName)}
            </td>

            <td>
                ${formatPercent(normalized.myUsage)}
            </td>

            <td>
                ${formatPercent(normalized.mlbUsage)}
            </td>

            <td>
                ${formatVelocity(normalized.myVelocity)}
            </td>

            <td>
                ${formatVelocity(normalized.mlbVelocity)}
            </td>

        `;


        body.appendChild(tr);

    });
}


/* =========================================================
   비교 데이터 정리
   ========================================================= */

function normalizeComparisonRow(row) {

    const pitchType =
        row.pitch_type ??
        row.pitchType ??
        row.pitch ??
        row.type ??
        null;


    return {

        pitchName:
            row.pitch_name ??
            row.pitchName ??
            (
                pitchType
                    ? PITCH_NAMES[pitchType] || pitchType
                    : "-"
            ),

        myUsage:
            toNumber(
                row.my_usage ??
                row.myUsage ??
                row.user_usage ??
                row.userUsage ??
                row.usage_me ??
                row.usage_user
            ),

        mlbUsage:
            toNumber(
                row.mlb_usage ??
                row.mlbUsage ??
                row.player_usage ??
                row.usage_mlb
            ),

        myVelocity:
            toNumber(
                row.my_velocity ??
                row.myVelocity ??
                row.user_velocity ??
                row.velocity_me
            ),

        mlbVelocity:
            toNumber(
                row.mlb_velocity ??
                row.mlbVelocity ??
                row.player_velocity ??
                row.velocity_mlb
            )
    };
}


/* =========================================================
   서버에 상세 비교 데이터가 없을 때
   입력값으로 기본 행 생성
   ========================================================= */

function createFallbackComparison() {

    return currentPitchData.map(pitch => {

        return {

            pitch_type:
                pitch.pitch_type,

            pitch_name:
                PITCH_NAMES[pitch.pitch_type] ||
                pitch.pitch_type,

            my_usage:
                pitch.usage,

            mlb_usage:
                null,

            my_velocity:
                pitch.velocity,

            mlb_velocity:
                null
        };

    });
}


/* =========================================================
   A/U/V 출력
   ========================================================= */

function renderScores(player) {

    renderOneScore("A", player.A);
    renderOneScore("U", player.U);
    renderOneScore("V", player.V);
}


function renderOneScore(code, score) {

    const scoreElement =
        document.getElementById(
            `score-${code}`
        );

    const barElement =
        document.getElementById(
            `bar-${code}`
        );


    if (score === null) {

        scoreElement.textContent = "-";

        barElement.style.width = "0%";

        return;
    }


    const safeScore =
        Math.max(
            0,
            Math.min(100, score)
        );


    scoreElement.textContent =
        score.toFixed(1);


    barElement.style.width =
        `${safeScore}%`;
}


/* =========================================================
   화면 전환
   ========================================================= */

function showSection(sectionId) {

    const sections = [
        "input-section",
        "results-section",
        "detail-section"
    ];


    sections.forEach(id => {

        const section =
            document.getElementById(id);

        if (!section) {
            return;
        }


        section.classList.toggle(
            "hidden",
            id !== sectionId
        );

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   입력 화면으로
   ========================================================= */

function backToInput() {

    showSection("input-section");

}


/* =========================================================
   결과 화면으로
   ========================================================= */

function backToResults() {

    showSection("results-section");

}


/* =========================================================
   로딩
   ========================================================= */

function showLoading(isLoading) {

    const loading =
        document.getElementById(
            "loading-box"
        );


    if (isLoading) {

        loading.classList.remove(
            "hidden"
        );

    } else {

        loading.classList.add(
            "hidden"
        );

    }
}


/* =========================================================
   점수 표시
   ========================================================= */

function formatScore(value) {

    if (value === null || value === undefined) {
        return "-";
    }

    return Number(value).toFixed(1);
}


/* =========================================================
   사용률 표시
   ========================================================= */

function formatPercent(value) {

    if (
        value === null ||
        value === undefined ||
        isNaN(value)
    ) {
        return "-";
    }

    return `${Number(value).toFixed(1).replace(/\.0$/, "")}%`;
}


/* =========================================================
   구속 표시
   ========================================================= */

function formatVelocity(value) {

    if (
        value === null ||
        value === undefined ||
        isNaN(value)
    ) {
        return "-";
    }

    return `${Number(value).toFixed(1).replace(/\.0$/, "")} km/h`;
}


/* =========================================================
   XSS 방지용 HTML Escape
   ========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}