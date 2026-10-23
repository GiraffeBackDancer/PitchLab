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
            playerId: player.player_id,
            name: player.player_name,
            season: player.season,
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
                    ${escapeHtml(player.name)} (${escapeHtml(String(player.season ?? "-"))})
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

    fetch(`/api/pitcher/${player.playerId}/seasons`)
        .then(response => {
            if (!response.ok) {
                throw new Error("시즌 데이터를 불러오지 못했습니다.");
            }
            return response.json();
        })
        .then(data => {
            renderSeasonAnalysis(data);
        })
        .catch(error => {
            console.error(error);
        });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function renderSeasonAnalysis(data) {
    const container = document.getElementById(
        "season-analysis-content"
    );

    if (!data.seasons || data.seasons.length === 0) {
        container.textContent = "시즌별 데이터가 없습니다.";
        return;
    }

    const seasons = [...data.seasons].sort(
        (a, b) => a.season - b.season
    );

    const pitchTypes = [
        ...new Set(
            seasons.flatMap(season =>
                season.pitches.map(pitch => pitch.pitch_type)
            )
        )
    ].sort();

    const header = seasons.map(season => `
    <th colspan="2">${season.season}년</th>
`).join("");

    const subHeader = seasons.map(() => `
    <th>사용률</th>
    <th>평균 구속</th>
`).join("");

    const rows = pitchTypes.map(pitchType => {
        const cells = seasons.map(season => {
            const pitch = season.pitches.find(
                item => item.pitch_type === pitchType
            );

            if (!pitch) {
                return `
                <td>—</td>
                <td>—</td>
            `;
            }

            return `
            <td>${pitch.usage.toFixed(1)}%</td>
            <td>${pitch.velocity.toFixed(1)} km/h</td>
        `;
        }).join("");

        return `
        <tr>
            <td>${pitchType}</td>
            ${cells}
        </tr>
    `;
    }).join("");

    container.innerHTML = `
        <div class="comparison-table-wrap">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th rowspan="2">구종</th>
                        ${header}
                    </tr>
                    <tr>
                        ${subHeader}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
        
        <div class="panel" id="slope-chart-panel">
            <h3>시즌별 구종 사용률 변화</h3>

            <p>
                구종별 사용률이 시즌 사이에
                얼마나 증가하거나 감소했는지 비교합니다.
            </p>

        <div id="slope-chart-container"></div>
        </div>
    `;
    if (seasons.length >= 2) {
        const before = seasons[0];
        const after = seasons[seasons.length - 1];

        const changeScore = calculateChangeScore(before, after);

        container.innerHTML += `
        <div class="panel">
            <h3>구종 구성 변화 점수</h3>

            <p>
                ${before.season}년 → ${after.season}년
            </p>

            <h2>${changeScore.toFixed(1)}%p</h2>

            <p>
                두 시즌 사이 구종 사용 비율이
                얼마나 달라졌는지 나타내는 지표입니다.
            </p>
        </div>
    `;
    }
    renderSlopeChart(seasons);
}
function calculateChangeScore(before, after) {
    const beforeUsage = {};
    const afterUsage = {};

    before.pitches.forEach(pitch => {
        beforeUsage[pitch.pitch_type] = pitch.usage;
    });

    after.pitches.forEach(pitch => {
        afterUsage[pitch.pitch_type] = pitch.usage;
    });

    const pitchTypes = new Set([
        ...Object.keys(beforeUsage),
        ...Object.keys(afterUsage)
    ]);

    let totalDifference = 0;

    pitchTypes.forEach(pitchType => {
        const beforeValue = beforeUsage[pitchType] || 0;
        const afterValue = afterUsage[pitchType] || 0;

        totalDifference += Math.abs(afterValue - beforeValue);
    });

    return totalDifference / 2;
}

function renderSlopeChart(seasons) {
    const container = document.getElementById("slope-chart-container");

    if (!container || seasons.length < 2) {
        return;
    }

    const before = seasons[0];
    const after = seasons[seasons.length - 1];

    const pitchTypes = [
        ...new Set([
            ...before.pitches.map(p => p.pitch_type),
            ...after.pitches.map(p => p.pitch_type)
        ])
    ];

    const colors = [
        "#3984cc", "#d77b4a", "#239d86",
        "#9470cc", "#d39b28", "#ce638a",
        "#64748b", "#7c9a43", "#0891b2"
    ];

    const pitches = pitchTypes.map((type, index) => {
        const beforePitch = before.pitches.find(p => p.pitch_type === type);
        const afterPitch = after.pitches.find(p => p.pitch_type === type);

        return {
            type,
            name: PITCH_NAMES[type] || type,
            before: beforePitch?.usage ?? 0,
            after: afterPitch?.usage ?? 0,
            color: colors[index % colors.length]
        };
    });

    // 가장 사용률 변화가 큰 구종을 기본 선택
    let selectedPitch = [...pitches].sort(
        (a, b) =>
            Math.abs(b.after - b.before) -
            Math.abs(a.after - a.before)
    )[0].type;

    function drawChart() {
        const width = 400;
        const height = 270;
        const leftX = 95;
        const rightX = 305;
        const topY = 40;
        const bottomY = 225;

        // 사용률이 높은 구종도 잘 보이도록 축 범위 자동 설정
        const maxUsage = Math.max(
            10,
            ...pitches.flatMap(p => [p.before, p.after])
        );

        const axisMax = Math.ceil(maxUsage / 10) * 10;

        const yPosition = usage =>
            bottomY - (usage / axisMax) * (bottomY - topY);

        const selected = pitches.find(p => p.type === selectedPitch);

        const grid = Array.from({ length: 5 }, (_, i) => {
            const value = axisMax * i / 4;
            const y = yPosition(value);

            return `
                <line
                    x1="${leftX}" y1="${y}"
                    x2="${rightX}" y2="${y}"
                    stroke="currentColor"
                    stroke-opacity="0.12"
                    stroke-dasharray="4 4"
                />

                <text
                    x="${leftX - 12}" y="${y + 4}"
                    text-anchor="end"
                    font-size="11"
                    fill="currentColor"
                    opacity="0.65"
                >${value.toFixed(0)}%</text>
            `;
        }).join("");

        // 선택하지 않은 구종은 흐리게 표시
        const backgroundLines = pitches
            .filter(p => p.type !== selectedPitch)
            .map(p => `
                <line
                    x1="${leftX}"
                    y1="${yPosition(p.before)}"
                    x2="${rightX}"
                    y2="${yPosition(p.after)}"
                    stroke="currentColor"
                    stroke-opacity="0.13"
                    stroke-width="1.5"
                />
            `).join("");

        const y1 = yPosition(selected.before);
        const y2 = yPosition(selected.after);

        const activeLine = `
            <line
                x1="${leftX}" y1="${y1}"
                x2="${rightX}" y2="${y2}"
                stroke="${selected.color}"
                stroke-width="3.5"
            />

            <circle
                cx="${leftX}" cy="${y1}"
                r="5" fill="${selected.color}"
            />

            <circle
                cx="${rightX}" cy="${y2}"
                r="5" fill="${selected.color}"
            />

            <text
                x="${leftX}"
                y="${Math.max(28, y1 - 12)}"
                text-anchor="middle"
                font-size="12"
                font-weight="bold"
                fill="${selected.color}"
            >${selected.before.toFixed(1)}%</text>

            <text
                x="${rightX}"
                y="${Math.max(28, y2 - 12)}"
                text-anchor="middle"
                font-size="12"
                font-weight="bold"
                fill="${selected.color}"
            >${selected.after.toFixed(1)}%</text>
        `;

        const buttons = pitches.map(p => `
            <button
                type="button"
                class="slope-pitch-btn"
                data-pitch="${p.type}"
                aria-pressed="${p.type === selectedPitch}"
                style="
                    padding:8px 12px;
                    border-radius:20px;
                    border:1px solid ${p.type === selectedPitch ? p.color : "#ccc"};
                    background:${p.type === selectedPitch ? p.color : "transparent"};
                    color:${p.type === selectedPitch ? "#fff" : "inherit"};
                    cursor:pointer;
                    font-size:13px;
                    font-weight:${p.type === selectedPitch ? "bold" : "normal"};
                "
            >
                ${p.name}
            </button>
        `).join("");

        const difference = selected.after - selected.before;
        const differenceText =
            `${difference > 0 ? "+" : ""}${difference.toFixed(1)}%p`;

        container.innerHTML = `
            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                justify-content:center;
                margin:16px 0;
            ">
                ${buttons}
            </div>

            <svg
                viewBox="0 0 ${width} ${height}"
                style="width:100%; max-width:650px; height:auto; display:block; margin:auto;"
                role="img"
                aria-label="구종별 사용률 변화"
            >
                <text x="${leftX}" y="20"
                    text-anchor="middle"
                    font-weight="bold"
                    fill="currentColor">
                    ${before.season}년
                </text>

                <text x="${rightX}" y="20"
                    text-anchor="middle"
                    font-weight="bold"
                    fill="currentColor">
                    ${after.season}년
                </text>

                ${grid}
                ${backgroundLines}
                ${activeLine}
            </svg>

            <div style="
                margin-top:12px;
                padding:16px;
                border-radius:12px;
                background:rgba(128,128,128,0.08);
                text-align:center;
            ">
                <strong>${selected.name} (${selected.type})</strong>

                <p style="margin:8px 0;">
                    ${before.season}년 ${selected.before.toFixed(1)}%
                    →
                    ${after.season}년 ${selected.after.toFixed(1)}%
                </p>

                <strong style="
                    font-size:24px;
                    color:${selected.color};
                ">
                    ${differenceText}
                </strong>
            </div>
        `;

        // 구종 버튼 클릭 이벤트
        container.querySelectorAll(".slope-pitch-btn").forEach(button => {
            button.addEventListener("click", () => {
                selectedPitch = button.dataset.pitch;
                drawChart();
            });
        });
    }

    drawChart();
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