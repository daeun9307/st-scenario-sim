import { saveSettingsDebounced, getContext, extension_settings } from '../../../extensions.js';
import { callGenericAI, showOverlay } from '../../../../script.js';

const MODULE_NAME = "scenario_sim_pro";

// 사용자님이 주신 믹스테이프 예시를 기본값으로 설정
const defaultScenario = `**Situation:**
- {{char}} made a mixtape for {{user}}, filled with songs that subtly express {{char}}'s feelings for {{user}}.
- To create a thoughtful mixtape based on {{char}}'s description and their relationship with {{user}} 
- Include various genres about love, desire, and lovers, such as jazz, pop, rap, and ballads.

---

**Format:**
- What are the songs {{char}} included in the mixtape?
- (Song Name): (Lyric line expressing his feelings noted by {{char}}), (Reason for including the song noted by {{char}})
- {{char}}'s dialogue: (Write {{char}}'s reaction in dialogue form.)`;

if (!extension_settings[MODULE_NAME]) {
    extension_settings[MODULE_NAME] = { 
        simulations: [{ title: defaultScenario, result: "" }], 
        lang: 'ko', 
        apiEndpoint: '' 
    };
}

const i18n = {
    ko: { title: "🎭 시나리오 시뮬레이터", add: "새 시나리오 추가", generate: "답변 생성", delete: "삭제", api: "커스텀 API 주소", loading: "AI가 곡을 고르는 중..." },
    en: { title: "🎭 Scenario Simulator", add: "Add Scenario", generate: "Generate", delete: "Delete", api: "Custom API URL", loading: "AI is picking songs..." }
};

function getT() { return i18n[extension_settings[MODULE_NAME].lang]; }

function renderSimManager() {
    const settings = extension_settings[MODULE_NAME];
    const T = getT();
    let html = `<div class="sim-container">
        <div class="sim-header"><h3>${T.title}</h3>
            <select id="sim-lang-sel" class="text_pole">
                <option value="ko" ${settings.lang === 'ko' ? 'selected' : ''}>KO</option>
                <option value="en" ${settings.lang === 'en' ? 'selected' : ''}>EN</option>
            </select>
        </div>
        <div class="sim-api-box"><small>${T.api}</small>
            <input id="sim-api-input" type="text" class="text_pole" value="${settings.apiEndpoint}" placeholder="https://...">
        </div>
        <button id="add-sim-btn" class="menu_button">${T.add}</button>
        <div id="sim-list">${settings.simulations.map((s, i) => `
            <div class="sim-item">
                <textarea class="sim-input text_pole" data-index="${i}" rows="6">${s.title}</textarea>
                <div class="sim-actions">
                    <button class="run-sim-btn menu_button" data-index="${i}">🚀 ${T.generate}</button>
                    <button class="del-sim-btn menu_button" style="color:#ff5555;" data-index="${i}">${T.delete}</button>
                </div>
                <div id="result-${i}" class="sim-result" style="${s.result ? '' : 'display:none;'}">${s.result || ''}</div>
            </div>`).join('')}</div></div>`;

    showOverlay(html);

    $('#sim-lang-sel').on('change', function() { settings.lang = $(this).val(); saveSettingsDebounced(); renderSimManager(); });
    $('#sim-api-input').on('change', function() { settings.apiEndpoint = $(this).val(); saveSettingsDebounced(); });
    $('#add-sim-btn').on('click', () => { settings.simulations.unshift({ title: "", result: "" }); saveSettingsDebounced(); renderSimManager(); });
    $('.sim-input').on('change', function() { settings.simulations[$(this).data('index')].title = $(this).val(); saveSettingsDebounced(); });
    $('.run-sim-btn').on('click', function() { runSimulation($(this).data('index')); });
    $('.del-sim-btn').on('click', function() { if(confirm("삭제할까요?")) { settings.simulations.splice($(this).data('index'), 1); saveSettingsDebounced(); renderSimManager(); } });
}

async function runSimulation(index) {
    const settings = extension_settings[MODULE_NAME];
    const T = getT();
    const sim = settings.simulations[index];
    const context = getContext();
    const resultDiv = $(`#result-${index}`);
    resultDiv.html(`<span style="color:cyan;">${T.loading}</span>`).show();

    const prompt = `[SYSTEM: SCENARIO SIMULATION]\n# CHAR: ${context.characters[context.characterId].name}\n# DESC: ${context.characters[context.characterId].description}\n# HISTORY: ${context.chat.slice(-10).map(m => m.mes).join('\n')}\n\n### REQUEST:\n${sim.title}`;

    try {
        const response = await callGenericAI(prompt, settings.apiEndpoint || null); 
        sim.result = response;
        resultDiv.text(response);
        saveSettingsDebounced();
    } catch (err) { resultDiv.text("Error: " + err); }
}

jQuery(() => {
    const btn = $('<div class="fa-solid fa-compact-disc nav-item" title="Scenario Sim"></div>').on('click', renderSimManager);
    $('#extensions_menu').append(btn);
});