/* SchoolNode — STUDENT NETWORK VIEWER (vanilla JS, no build step) */
(function () {
  "use strict";

  /* ---------- LIVE Google Sheet (published CSV export) ---------- */
  // PRIVACY WARNING: SHEET_ID is a public link baked into client-side code.
  // The full published CSV is fetched in-browser, so EVERY column (incl. DOB,
  // SEND, medical/intervention notes) is visible in transit (Network tab) even
  // though the app only maps an allowlist client-side. STRONGLY recommended:
  // publish a SANITIZED MIRROR TAB containing only
  // Student/Gender/Homeroom/Pathway/Tutor/Attendance/Option/Forecast columns
  // and point DEFAULT_GID at that tab (or front with a proxy that allowlists
  // those columns). Owner decision needed for mirror tab — code cannot create it.
  var SHEET_ID = "1uAhZI37v42wYGl_hmywVw_lCiZjyQJS1e_XAWe96uH4";
  var DEFAULT_GID = "867103286";
  function sheetGid() {
    try {
      var g = new URLSearchParams(window.location.search).get("gid");
      return g || DEFAULT_GID;
    } catch (e) { return DEFAULT_GID; }
  }
  // Contract: ?gid= URL param selects the sheet tab; falls back to DEFAULT_GID.
  // sheetCsvUrl() is the single source for the export URL (recomputed on every
  // load + refresh so ?gid= stays honoured); do not cache it in a const.
  function sheetCsvUrl() {
    return "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/export?format=csv&gid=" + sheetGid();
  }

  /* ---------- file:// fallback data (same 12 students as notes/students.json) ---------- */
  var FALLBACK_STUDENTS = [
    { id: "alfie", name: "ALFIE", homeroom: "11.1", pathway: "Triple Science", gender: "Male", tutor: "Mr Smith", attendance: "96.5%", options: ["Computer Science", "Business", "PE"], subjects: { "Computer Science": "8", "Business": "7", "PE": "9" }, extra: "Coding club lead, enjoys football." },
    { id: "annick", name: "ANNICK", homeroom: "11.1", pathway: "Science", gender: "Female", tutor: "Ms Lee", attendance: "98.2%", options: ["Psychology", "Art", "French"], subjects: { "Psychology": "8", "Art": "9", "French": "7" }, extra: "Art exhibition finalist, peer mentor." },
    { id: "atom", name: "ATOM", homeroom: "11.1", pathway: "Business", gender: "Male", tutor: "Mrs Patel", attendance: "94.1%", options: ["Business", "Computer Science", "History"], subjects: { "Business": "7", "Computer Science": "6", "History": "7" }, extra: "Young Enterprise team member." },
    { id: "aya", name: "AYA", homeroom: "11.1", pathway: "Arts", gender: "Female", tutor: "Mr Smith", attendance: "97.8%", options: ["Art", "Music", "French"], subjects: { "Art": "9", "Music": "8", "French": "" }, extra: "Choir soloist, plays violin." },
    { id: "candy", name: "CANDY", homeroom: "11.2", pathway: "Science", gender: "Female", tutor: "Ms Lee", attendance: "95.3%", options: ["Marine Science", "Psychology", "Geography"], subjects: { "Marine Science": "8", "Psychology": "7", "Geography": "6" }, extra: "Beach-clean volunteer, swim squad." },
    { id: "chi-o", name: "CHI-O", homeroom: "11.2", pathway: "Triple Science", gender: "Male", tutor: "Mrs Patel", attendance: "99.1%", options: ["Computer Science", "Marine Science", "Music"], subjects: { "Computer Science": "9", "Marine Science": "8", "Music": "7" }, extra: "Robotics club, grade 5 piano." },
    { id: "cooper", name: "COOPER", homeroom: "11.2", pathway: "Business", gender: "Male", tutor: "Mr Smith", attendance: "93.7%", options: ["Business", "History", "DT"], subjects: { "Business": "6", "History": "5", "DT": "7" }, extra: "DT workshop assistant, rugby team." },
    { id: "jing", name: "JING", homeroom: "11.2", pathway: "Arts", gender: "Female", tutor: "Ms Lee", attendance: "96.9%", options: ["Art", "DT", "Music"], subjects: { "Art": "8", "DT": "8", "Music": "" }, extra: "Set design for school play." },
    { id: "newton", name: "NEWTON", homeroom: "11.3", pathway: "Triple Science", gender: "Male", tutor: "Mrs Patel", attendance: "97.2%", options: ["Computer Science", "Marine Science", "PE"], subjects: { "Computer Science": "8", "Marine Science": "9", "PE": "7" }, extra: "Science fair winner, athletics." },
    { id: "piper", name: "PIPER", homeroom: "11.3", pathway: "Arts", gender: "Female", tutor: "Mr Smith", attendance: "95.8%", options: ["Music", "Art", "Psychology"], subjects: { "Music": "9", "Art": "7", "Psychology": "6" }, extra: "Drama club lead, songwriting." },
    { id: "rose", name: "ROSE", homeroom: "11.3", pathway: "Science", gender: "Female", tutor: "Ms Lee", attendance: "98.7%", options: ["Psychology", "History", "French"], subjects: { "Psychology": "9", "History": "8", "French": "8" }, extra: "Debate society captain." },
    { id: "sun", name: "SUN", homeroom: "11.3", pathway: "Business", gender: "Male", tutor: "Mrs Patel", attendance: "92.4%", options: ["Business", "Geography", "PE"], subjects: { "Business": "7", "Geography": "6", "PE": "" }, extra: "Basketball team, tuck-shop volunteer." }
  ];

  /* ---------- homeroom colours ---------- */
  var HOMEROOM_COLORS = {
    "11.1": "#5B9BD5",
    "11.2": "#70AD47",
    "11.3": "#ED7D31"
  };
  var DEFAULT_COLOR = "#94a3b8";

  var EDGE_MODES = ["Obsidian (all linked)", "Shared Homeroom", "Shared Option Subject", "Both"];

  var state = {
    students: [],     // { id, name, homeroom, pathway, gender, tutor, attendance, options, subjects, extra }
    notes: [],        // legacy markdown notes (kept for renderer compat)
    network: null,
    fallback: null,   // canvas-fallback controller
    selectedId: null,
    searchQuery: "",
    activeTag: "",    // legacy tag filter value (mirrors option filter)
    activeOption: "",
    activeHomeroom: "",
    activePathway: "",
    edgeMode: "Obsidian (all linked)",
    lastEdges: [],
    dataSource: null // { mode: "LIVE"|"LOCAL"|"FALLBACK", updatedAt: Date, sheetError: string }
  };

  var graphEl = document.getElementById("graph");
  var previewEl = document.getElementById("preview");
  var searchEl = document.getElementById("search");
  var tagFilterEl = document.getElementById("tagFilter");
  var addBtn = document.getElementById("addNoteBtn");
  var statsEl = document.getElementById("stats");
  var cdnFallbackEl = document.getElementById("cdnFallback");
  var controlsEl = document.querySelector("header .controls");

  var edgeModeEl = null;
  var optionFilterEl = null;
  var homeroomFilterEl = null;
  var pathwayFilterEl = null;
  var csvFileEl = null;

  /* ============================================================
     Legacy markdown / wikilink renderer (kept untouched for old notes)
     ============================================================ */
  function parseWikilinks(text) {
    var out = [];
    var re = /\[\[([^\]]+)\]\]/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var name = m[1].trim();
      if (name) out.push(name);
    }
    return out;
  }

  function parseTags(text) {
    var out = [];
    var re = /(^|\s)#([a-zA-Z0-9_-]+)/g;
    var m;
    while ((m = re.exec(text)) !== null) out.push(m[2].toLowerCase());
    return out.filter(function (t, i, a) { return a.indexOf(t) === i; });
  }

  function titleFromFile(file) {
    return file.replace(/\.md$/i, "").replace(/[-_]+/g, " ");
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderMarkdown(raw) {
    var lines = escapeHtml(raw).split("\n");
    var html = [];
    var inList = false;

    function inline(s) {
      s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
      s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" style="max-width:100%" />');
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      s = s.replace(/\[\[([^\]]+)\]\]/g, function (m, name) {
        return '<span class="wikilink" data-link="' + escapeHtml(name) + '">[[' + escapeHtml(name) + "]]</span>";
      });
      s = s.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1<span class="tag">#$2</span>');
      s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return s;
    }

    lines.forEach(function (line) {
      var t = line.trim();
      if (/^#{1,6}\s/.test(t)) {
        if (inList) { html.push("</ul>"); inList = false; }
        var level = t.match(/^#+/)[0].length;
        html.push("<h" + level + ">" + inline(t.replace(/^#+\s*/, "")) + "</h" + level + ">");
      } else if (/^&gt;\s?/.test(t)) {
        if (inList) { html.push("</ul>"); inList = false; }
        html.push("<blockquote>" + inline(t.replace(/^&gt;\s?/, "")) + "</blockquote>");
      } else if (/^[-*]\s+/.test(t)) {
        if (!inList) { html.push("<ul>"); inList = true; }
        html.push("<li>" + inline(t.replace(/^[-*]\s+/, "")) + "</li>");
      } else if (t === "") {
        if (inList) { html.push("</ul>"); inList = false; }
      } else {
        if (inList) { html.push("</ul>"); inList = false; }
        html.push("<p>" + inline(line) + "</p>");
      }
    });
    if (inList) html.push("</ul>");
    return html.join("\n");
  }

  /* ============================================================
     Student helpers
     ============================================================ */
  function firstName(name) {
    var w = String(name || "").split(/\s+/)[0] || "";
    if (!w) return "";
    // Capitalize: first letter upper, rest lower (handles "CHI-O" -> "Chi-o", "ALFIE" -> "Alfie")
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }

  function homeroomColor(h) {
    return HOMEROOM_COLORS[h] || DEFAULT_COLOR;
  }

  function tooltipFor(s) {
    // hover tooltip title = Name + Homeroom + Pathway + Options + Attendance (detail panel shows full record on click)
    return s.name + " • Homeroom " + s.homeroom + " • " + s.pathway +
      "\nOptions: " + (s.options || []).join(", ") +
      "\nAttendance: " + s.attendance;
  }

  function normalizeStudent(o, i) {
    var name = String((o && o.name) || ("Student " + (i + 1))).trim();
    var id = String((o && o.id) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || ("student-" + i));
    return {
      id: id,
      name: name,
      homeroom: String((o && o.homeroom) || ""),
      pathway: String((o && o.pathway) || ""),
      gender: String((o && o.gender) || ""),
      tutor: String((o && o.tutor) || ""),
      attendance: String((o && o.attendance) || ""),
      options: Array.isArray(o && o.options) ? o.options.map(String) : [],
      subjects: (o && o.subjects && typeof o.subjects === "object") ? o.subjects : {},
      extra: String((o && o.extra) || "")
    };
  }

  function findStudent(id) {
    for (var i = 0; i < state.students.length; i++) {
      if (state.students[i].id === id) return state.students[i];
    }
    return null;
  }

  /* ============================================================
     Edges — Shared Homeroom / Shared Option Subject / Both (union)
     Undirected (no arrows). No duplicate pairs (i < j loop).
     ============================================================ */
  function shareOption(a, b) {
    var opts = {};
    (a.options || []).forEach(function (o) { opts[o] = true; });
    for (var i = 0; i < (b.options || []).length; i++) {
      if (opts[b.options[i]]) return true;
    }
    return false;
  }

  function buildEdges(students, mode) {
    var edges = [];
    var isObsidian = mode === "Obsidian (all linked)";
    var baseMode = isObsidian ? "Both" : mode;
    for (var i = 0; i < students.length; i++) {
      for (var j = i + 1; j < students.length; j++) {
        var a = students[i], b = students[j];
        var sameRoom = a.homeroom && a.homeroom === b.homeroom;
        var sameOpt = shareOption(a, b);
        var link = false;
        if (baseMode === "Shared Homeroom") link = !!sameRoom;
        else if (baseMode === "Shared Option Subject") link = sameOpt;
        else if (baseMode === "Both") link = !!sameRoom || sameOpt;
        if (link) edges.push({ from: a.id, to: b.id, obsWeak: false });
      }
    }
    if (isObsidian) {
      // Obsidian never leaves a dot floating alone: wire isolates with 1 faint link to homeroom hub
      var deg = {};
      edges.forEach(function (e) { deg[e.from]=(deg[e.from]||0)+1; deg[e.to]=(deg[e.to]||0)+1; });
      // homeroom hub = most connected node per homeroom
      var hubByRoom = {};
      students.forEach(function (s) {
        var d = deg[s.id]||0;
        if (!hubByRoom[s.homeroom] || d > (deg[hubByRoom[s.homeroom]]||-1)) hubByRoom[s.homeroom]=s.id;
      });
      students.forEach(function (s) {
        if ((deg[s.id]||0)===0) {
          var hub = hubByRoom[s.homeroom] || students[0].id;
          if (hub !== s.id) edges.push({ from: s.id, to: hub, obsWeak: true });
          else if (students.length>1) edges.push({ from: s.id, to: students[(students.indexOf(s)+1)%students.length].id, obsWeak: true });
        }
      });
      // one cross-homeroom bridge per homeroom so cluster is single component like Obsidian graph
      var rooms = Object.keys(hubByRoom);
      for (var k=1;k<rooms.length;k++) edges.push({ from: hubByRoom[rooms[k-1]], to: hubByRoom[rooms[k]], obsWeak: true });
    }
    return edges;
  }

  /* ============================================================
     Filters — search (name substring) + option + homeroom + pathway
     ============================================================ */
  function studentVisible(s) {
    var q = state.searchQuery.trim().toLowerCase();
    var okSearch = !q || String(s.name).toLowerCase().indexOf(q) !== -1;
    var okOption = !state.activeOption || (s.options || []).indexOf(state.activeOption) !== -1;
    var okRoom = !state.activeHomeroom || s.homeroom === state.activeHomeroom;
    var okPath = !state.activePathway || s.pathway === state.activePathway;
    return okSearch && okOption && okRoom && okPath;
  }

  // Legacy alias kept for compat with markdown-graph mode callers.
  function noteVisible(n) {
    if (n && (n.options || n.homeroom || n.pathway) && n.name) return studentVisible(n);
    // legacy note shape { title, raw, tags }
    var q = state.searchQuery.trim().toLowerCase();
    var okSearch = !q || String(n.title || n.name || "").toLowerCase().indexOf(q) !== -1 ||
      String(n.raw || "").toLowerCase().indexOf(q) !== -1;
    var okTag = !state.activeTag || (n.tags || []).indexOf(state.activeTag) !== -1;
    return okSearch && okTag;
  }

  function highlightColor(n) {
    // Works for student nodes (homeroom base) + search/selected accents.
    var base = homeroomColor(n.homeroom);
    var q = state.searchQuery.trim().toLowerCase();
    var isMatch = q && String(n.name || n.title || "").toLowerCase().indexOf(q) !== -1;
    if (isMatch) return { background: "#ffe08a", border: "#e8a100", highlight: { background: "#ffe08a", border: "#e8a100" } };
    if (state.selectedId === n.id) return { background: "#cfe0ff", border: "#4f7cff", highlight: { background: "#cfe0ff", border: "#4f7cff" } };
    return { background: base, border: base, highlight: { background: base, border: base } };
  }

  /* ============================================================
     Graph data — label = first name, size = 22 + degree*2
     ============================================================ */
  function graphData() {
    var visible = state.students.filter(studentVisible);
    var visIds = {};
    visible.forEach(function (s) { visIds[s.id] = true; });
    var allEdges = buildEdges(state.students, state.edgeMode);
    var edges = allEdges.filter(function (e) { return visIds[e.from] && visIds[e.to]; });
    state.lastEdges = edges;

    // degree over visible edges
    var degree = {};
    edges.forEach(function (e) {
      degree[e.from] = (degree[e.from] || 0) + 1;
      degree[e.to] = (degree[e.to] || 0) + 1;
    });

    var nodes = visible.map(function (s) {
      var size = Math.min(22 + (degree[s.id] || 0) * 2, 40);
      return {
        id: s.id,
        label: firstName(s.name),
        shape: "dot",
        size: size,
        color: highlightColor(s),
        title: tooltipFor(s) // hover tooltip
      };
    });

    var visEdges = edges.map(function (e) {
      return e.obsWeak ? { from: e.from, to: e.to, color: { color: "#cbd5e1", opacity: 0.35 }, dashes: [6,6], width: 1 } : { from: e.from, to: e.to };
    });
    return { nodes: nodes, edges: visEdges };
  }

  function buildGraph() {
    var hasVis = typeof window.vis !== "undefined" && window.vis && window.vis.Network;
    if (hasVis) {
      try {
        buildVisNetwork();
        if (cdnFallbackEl) cdnFallbackEl.hidden = true;
        return;
      } catch (e) {
        console.warn("vis-network failed, falling back:", e);
      }
    }
    if (cdnFallbackEl) cdnFallbackEl.hidden = false;
    buildCanvasFallback();
  }

  function buildVisNetwork() {
    var data = graphData();
    var nodes = new vis.DataSet(data.nodes);
    var edges = new vis.DataSet(data.edges);
    var options = {
      physics: {
        enabled: true,
        stabilization: { enabled: true, iterations: 800, fit: true },
        solver: "barnesHut",
        barnesHut: { gravitationalConstant: -7000, centralGravity: 0.15, springLength: 140, springConstant: 0.03, damping: 0.18, avoidOverlap: 0.2 },
        maxVelocity: 30,
        minVelocity: 0.5
      },
      interaction: { dragNodes: true, dragView: true, zoomView: true, hover: true, hideEdgesOnDrag: true, hideEdgesOnZoom: true, tooltipDelay: 150 },
      nodes: { font: { size: 14 }, borderWidth: 2, scaling: { min: 12, max: 42 } },
      edges: { color: { color: "#94a3b8", highlight: "#4f7cff", hover: "#64748b", opacity: 0.55 }, width: 1.2, hoverWidth: 0.8, smooth: false }
    };
    if (state.network) state.network.destroy();
    state.network = new vis.Network(graphEl, { nodes: nodes, edges: edges }, options);
    state.network.on("click", function (p) {
      if (p.nodes && p.nodes.length) selectNode(p.nodes[0]);
    });
    // Obsidian-like: settle then freeze for 60fps; resume on drag
    var stabilized = false;
    state.network.on("stabilizationIterationsDone", function () {
      if (!stabilized) { stabilized = true; state.network.setOptions({ physics: { enabled: false } }); }
    });
    state.network.on("dragStart", function (p) {
      if (p.nodes && p.nodes.length) state.network.setOptions({ physics: { enabled: true } });
    });
    state.network.on("dragEnd", function () {
      setTimeout(function () { state.network.setOptions({ physics: { enabled: false } }); }, 600);
    });
  }

  function refreshVisGraph() {
    if (!state.network || typeof vis === "undefined") return;
    var data = graphData();
    state.network.setData({ nodes: new vis.DataSet(data.nodes), edges: new vis.DataSet(data.edges) });
  }

  function applyFilters() {
    if (state.network) {
      refreshVisGraph();
    }
    if (state.fallback) {
      var visible = {};
      state.students.forEach(function (s) { visible[s.id] = studentVisible(s); });
      state.fallback.setVisible(visible);
    }
    updateStats();
  }

  /* ---------- canvas fallback (draggable coloured dots) ---------- */
  function buildCanvasFallback() {
    graphEl.innerHTML = "";
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    graphEl.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0;
    function resize() {
      W = canvas.width = graphEl.clientWidth || 600;
      H = canvas.height = graphEl.clientHeight || 400;
      draw();
    }
    window.addEventListener("resize", resize);

    var pts = {};
    function layout() {
      state.students.forEach(function (s, i) {
        if (!pts[s.id]) {
          var a = (i / Math.max(1, state.students.length)) * Math.PI * 2;
          pts[s.id] = { x: 300 + Math.cos(a) * 160, y: 220 + Math.sin(a) * 140, r: 30 };
        }
      });
    }
    layout();

    var visible = {};
    state.students.forEach(function (s) { visible[s.id] = studentVisible(s); });
    var drag = null;

    function currentEdges() {
      var all = buildEdges(state.students, state.edgeMode);
      return all.filter(function (e) { return visible[e.from] && visible[e.to]; });
    }

    function draw() {
      if (!W) { W = canvas.width = graphEl.clientWidth || 600; H = canvas.height = graphEl.clientHeight || 400; }
      ctx.clearRect(0, 0, W, H);
      var sx = W / 640, sy = H / 460;
      ctx.strokeStyle = "#94a3b8";
      currentEdges().forEach(function (e) {
        if (!pts[e.from] || !pts[e.to]) return;
        ctx.beginPath();
        ctx.moveTo(pts[e.from].x * sx, pts[e.from].y * sy);
        ctx.lineTo(pts[e.to].x * sx, pts[e.to].y * sy);
        ctx.stroke();
      });
      state.students.forEach(function (s) {
        if (!visible[s.id]) return;
        var p = pts[s.id];
        if (!p) return;
        var c = highlightColor(s);
        var bg = (c && c.background) ? c.background : homeroomColor(s.homeroom);
        var bd = (c && c.border) ? c.border : bg;
        ctx.beginPath();
        ctx.arc(p.x * sx, p.y * sy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = bd;
        ctx.stroke();
        ctx.fillStyle = "#22303c";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(firstName(s.name).slice(0, 18), p.x * sx, p.y * sy + 4);
      });
      state.lastEdges = currentEdges();
    }

    function hit(mx, my) {
      var sx = W / 640, sy = H / 460;
      for (var i = state.students.length - 1; i >= 0; i--) {
        var s = state.students[i];
        if (!visible[s.id]) continue;
        var p = pts[s.id];
        if (!p) continue;
        var dx = mx - p.x * sx, dy = my - p.y * sy;
        if (Math.sqrt(dx * dx + dy * dy) < p.r + 6) return s.id;
      }
      return null;
    }

    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    canvas.onmousedown = function (e) {
      var m = pos(e);
      var id = hit(m.x, m.y);
      if (id) drag = id;
    };
    window.onmouseup = function () { drag = null; };
    canvas.onmousemove = function (e) {
      if (!drag) return;
      var m = pos(e);
      var sx = W / 640, sy = H / 460;
      pts[drag].x = m.x / sx;
      pts[drag].y = m.y / sy;
      draw();
    };
    canvas.onclick = function (e) {
      var m = pos(e);
      var id = hit(m.x, m.y);
      if (id) selectNode(id);
    };
    // hover tooltip via canvas title
    canvas.onmousemoveTooltip = null;
    canvas.addEventListener("mousemove", function (e) {
      if (drag) return;
      var m = pos(e);
      var id = hit(m.x, m.y);
      if (id) {
        var s = findStudent(id);
        canvas.title = s ? tooltipFor(s) : "";
        canvas.style.cursor = "pointer";
      } else {
        canvas.title = "";
        canvas.style.cursor = "default";
      }
    });

    state.fallback = {
      setVisible: function (v) { visible = v; draw(); },
      redraw: function () { layout(); draw(); },
      refresh: function () {
        visible = {};
        state.students.forEach(function (s) { visible[s.id] = studentVisible(s); });
        layout();
        draw();
      }
    };
    resize();
    state.fallback.redraw();
  }

  /* ============================================================
     Detail panel — full student info into #preview
     ============================================================ */
  function selectNode(id) {
    state.selectedId = id;
    var s = findStudent(id);
    if (!s) return;
    renderStudentDetail(s);
    applyFilters();
    // re-render after applyFilters rebuilt colours so selection sticks
    renderStudentDetail(s);
    if (state.network) refreshVisGraph();
  }

  function renderStudentDetail(s) {
    var opts = (s.options || []).map(function (o) {
      return "<li>" + escapeHtml(o) + "</li>";
    }).join("");
    var subjKeys = Object.keys(s.subjects || {});
    var subjRows = subjKeys.length ? subjKeys.map(function (k) {
      var g = s.subjects[k];
      return "<tr><td>" + escapeHtml(k) + "</td><td>" + escapeHtml(g === undefined || g === null ? "" : String(g)) + "</td></tr>";
    }).join("") : "<tr><td colspan='2'><em>No grades recorded</em></td></tr>";

    previewEl.innerHTML =
      "<div class='student-detail'>" +
      "<h2>" + escapeHtml(s.name) + " <span class='tag'>" + escapeHtml(firstName(s.name)) + "</span></h2>" +
      "<p><span class='tag'>Homeroom " + escapeHtml(s.homeroom) + "</span> " +
      "<span class='tag'>" + escapeHtml(s.pathway) + "</span></p>" +
      "<table class='student-table'>" +
      "<tr><th>Homeroom</th><td>" + escapeHtml(s.homeroom) + "</td></tr>" +
      "<tr><th>Pathway</th><td>" + escapeHtml(s.pathway) + "</td></tr>" +
      "<tr><th>Gender</th><td>" + escapeHtml(s.gender) + "</td></tr>" +
      "<tr><th>Tutor</th><td>" + escapeHtml(s.tutor) + "</td></tr>" +
      "<tr><th>Attendance</th><td>" + escapeHtml(s.attendance) + "</td></tr>" +
      "</table>" +
      "<h3>Options</h3><ul>" + (opts || "<li><em>None</em></li>") + "</ul>" +
      "<h3>Subjects &amp; grades</h3><table class='student-table'><tr><th>Subject</th><th>Grade</th></tr>" + subjRows + "</table>" +
      "<h3>Extra</h3><p>" + escapeHtml(s.extra || "—") + "</p>" +
      "</div>";
  }

  /* ============================================================
     Header controls — edgeMode / homeroomFilter / pathwayFilter /
     optionFilter / csvFile (all JS-created if missing)
     ============================================================ */
  function makeSelect(id, label, values) {
    var sel = document.getElementById(id);
    if (sel) return sel;
    sel = document.createElement("select");
    sel.id = id;
    sel.setAttribute("aria-label", label);
    if (controlsEl) controlsEl.appendChild(sel);
    else document.querySelector("header").appendChild(sel);
    return sel;
  }

  function setupControls() {
    // Edge mode select
    edgeModeEl = makeSelect("edgeMode", "Edge mode");
    edgeModeEl.innerHTML = "";
    EDGE_MODES.forEach(function (m) {
      var o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      edgeModeEl.appendChild(o);
    });
    edgeModeEl.value = state.edgeMode;
    edgeModeEl.addEventListener("change", function () {
      state.edgeMode = edgeModeEl.value;
      if (state.network) refreshVisGraph();
      if (state.fallback) state.fallback.refresh();
      updateStats();
    });

    // Homeroom filter
    homeroomFilterEl = makeSelect("homeroomFilter", "Filter by homeroom");
    homeroomFilterEl.addEventListener("change", function () {
      state.activeHomeroom = homeroomFilterEl.value;
      applyFilters();
    });

    // Pathway filter
    pathwayFilterEl = makeSelect("pathwayFilter", "Filter by pathway");
    pathwayFilterEl.addEventListener("change", function () {
      state.activePathway = pathwayFilterEl.value;
      applyFilters();
    });

    // Option-subject filter (dedicated select; legacy #tagFilter kept in sync)
    optionFilterEl = makeSelect("optionFilter", "Filter by option subject");
    optionFilterEl.addEventListener("change", function () {
      state.activeOption = optionFilterEl.value;
      state.activeTag = optionFilterEl.value;
      if (tagFilterEl) tagFilterEl.value = optionFilterEl.value;
      applyFilters();
    });
    if (tagFilterEl) {
      tagFilterEl.addEventListener("change", function () {
        state.activeOption = tagFilterEl.value;
        state.activeTag = tagFilterEl.value;
        if (optionFilterEl) optionFilterEl.value = tagFilterEl.value;
        applyFilters();
      });
    }

    // CSV import input
    csvFileEl = document.getElementById("csvFile");
    if (!csvFileEl) {
      csvFileEl = document.createElement("input");
      csvFileEl.type = "file";
      csvFileEl.id = "csvFile";
      csvFileEl.accept = ".csv";
      csvFileEl.title = "Import students via CSV";
      if (controlsEl) controlsEl.appendChild(csvFileEl);
      else document.querySelector("header").appendChild(csvFileEl);
    } else {
      csvFileEl.accept = ".csv";
    }
    csvFileEl.addEventListener("change", function () {
      var f = csvFileEl.files && csvFileEl.files[0];
      if (f) importCSVFile(f);
      csvFileEl.value = "";
    });

    // Drag + drop CSV anywhere on document / graph element
    function onDropFile(file) {
      if (file && /\.csv$/i.test(file.name || "")) importCSVFile(file);
    }
    document.addEventListener("dragover", function (e) { e.preventDefault(); });
    document.addEventListener("drop", function (e) {
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) onDropFile(f);
    });
    if (graphEl) {
      graphEl.addEventListener("dragover", function (e) { e.preventDefault(); });
      graphEl.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) onDropFile(f);
      });
    }

    // Refresh button — reload LIVE data from Google Sheets
    var refreshBtn = document.getElementById("refreshSheetBtn");
    if (!refreshBtn) {
      refreshBtn = document.createElement("button");
      refreshBtn.id = "refreshSheetBtn";
      refreshBtn.textContent = "\u21BB Refresh";
      refreshBtn.title = "Reload live data from Google Sheets";
      if (controlsEl) controlsEl.appendChild(refreshBtn);
      else document.querySelector("header").appendChild(refreshBtn);
    }
    refreshBtn.onclick = function () {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "\u21BB Loading\u2026";
      refreshFromSheet().catch(function (e) {
        alert("Refresh failed: " + ((e && e.message) || e));
      }).then(function () {
        refreshBtn.disabled = false;
        refreshBtn.textContent = "\u21BB Refresh";
      });
    };

    repopulateFilters();
  }

  function uniqueSorted(fn) {
    var seen = {};
    state.students.forEach(function (s) {
      (fn(s) || []).forEach(function (v) { if (v) seen[v] = true; });
    });
    return Object.keys(seen).sort();
  }

  function fillSelect(sel, allLabel, values, current) {
    var cur = current !== undefined ? current : sel.value;
    sel.innerHTML = "";
    var all = document.createElement("option");
    all.value = "";
    all.textContent = allLabel;
    sel.appendChild(all);
    values.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    if (cur && (cur === "" || values.indexOf(cur) !== -1)) sel.value = cur;
  }

  function repopulateFilters() {
    var options = uniqueSorted(function (s) { return s.options; });
    var pathways = uniqueSorted(function (s) { return [s.pathway]; });
    var rooms = uniqueSorted(function (s) { return [s.homeroom]; });

    if (optionFilterEl) fillSelect(optionFilterEl, "All options", options, state.activeOption);
    if (tagFilterEl) fillSelect(tagFilterEl, "All tags", options, state.activeTag);
    if (homeroomFilterEl) fillSelect(homeroomFilterEl, "All homerooms", rooms.length ? rooms : ["11.1", "11.2", "11.3"], state.activeHomeroom);
    if (pathwayFilterEl) fillSelect(pathwayFilterEl, "All pathways", pathways, state.activePathway);
  }

  /* ============================================================
     CSV import — client-side only, quote-aware comma split
     Header: Name,Homeroom,Pathway,Gender,Option1,Option2,Option3,Attendance
     ============================================================ */
  function parseCSVLine(line) {
    var out = [];
    var cur = "";
    var inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (inQ) {
        if (c === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } // "" escape
          else inQ = false;
        } else {
          cur += c;
        }
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { out.push(cur); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur);
    return out.map(function (v) { return v.trim(); });
  }

  function parseCSV(text) {
    var rows = [];
    var lines = String(text).split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
    if (!lines.length) return rows;
    var header = parseCSVLine(lines[0]).map(function (h) { return h.toLowerCase(); });
    function col(name) { return header.indexOf(name.toLowerCase()); }
    var ci = {
      name: col("name"), homeroom: col("homeroom"), pathway: col("pathway"),
      gender: col("gender"), o1: col("option1"), o2: col("option2"), o3: col("option3"),
      attendance: col("attendance")
    };
    for (var r = 1; r < lines.length; r++) {
      var cells = parseCSVLine(lines[r]);
      function get(idx) { return idx >= 0 && idx < cells.length ? cells[idx] : ""; }
      var nm = get(ci.name);
      if (!nm) continue;
      var opts = [get(ci.o1), get(ci.o2), get(ci.o3)].filter(function (v) { return v !== ""; });
      rows.push({
        id: nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || ("imported-" + r),
        name: nm.toUpperCase(),
        homeroom: get(ci.homeroom),
        pathway: get(ci.pathway),
        gender: get(ci.gender),
        tutor: "Imported",
        attendance: get(ci.attendance),
        options: opts,
        subjects: {},
        extra: "Imported via CSV"
      });
    }
    return rows;
  }

  /* ============================================================
     LIVE Google Sheet — fetch + parse (TWO header rows; row2 = keys)
     Only maps: Student, Gender, Homeroom, Pathway, Tutor,
     Attendance (26/27) %, repeating Option -> Current Forecast.
     NEVER maps D.O.B, SEND, Wave, PASS, SAS, PTE/PTM, Thai,
     intervention/details/staff/medical columns.
     ============================================================ */
  function fetchSheetCSV(url) {
    var u = String(url || sheetCsvUrl());
    u += (u.indexOf("?") === -1 ? "?" : "&") + "_ts=" + Date.now();
    return fetch(u, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("Sheet fetch failed: HTTP " + r.status);
      return r.text();
    });
  }

  // Split CSV text into logical rows, respecting RFC4180 quoted newlines
  // (free-text columns contain multi-line cells; a naive \n split
  // creates phantom student rows).
  function splitCSVRows(text) {
    var rows = [];
    var cur = "";
    var inQ = false;
    var s = String(text || "");
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '"') {
        if (inQ && s[i + 1] === '"') { cur += '""'; i++; }
        else { inQ = !inQ; cur += c; }
      } else if (c === "\n" && !inQ) {
        rows.push(cur); cur = "";
      } else if (c === "\r") {
        if (!inQ) { rows.push(cur); cur = ""; if (s[i + 1] === "\n") i++; }
        else cur += c;
      } else {
        cur += c;
      }
    }
    rows.push(cur);
    return rows;
  }

  function parseSheetCSV(text) {
    var lines = splitCSVRows(text);
    if (lines.length < 3) return [];
    // Row 1 = group titles (ignored). Row 2 (index 1) = real keys.
    var headers = parseCSVLine(lines[1]).map(function (h) { return String(h || "").trim(); });
    function findHeader(pred) {
      for (var i = 0; i < headers.length; i++) { if (pred(headers[i], i)) return i; }
      return -1;
    }
    var studentIdx = findHeader(function (h) { return h === "Student"; });
    if (studentIdx < 0) studentIdx = 0;
    var genderIdx = findHeader(function (h) { return h === "Gender"; });
    var homeroomIdx = findHeader(function (h) { return h === "Homeroom"; });
    var pathwayIdx = findHeader(function (h) { return h === "Pathway"; });
    var tutorIdx = findHeader(function (h) { return h === "Tutor"; });
    var attIdx = findHeader(function (h) { return h.indexOf("26/27") !== -1 && h.indexOf("Attendance") !== -1; });
    var optionIdxs = [];
    for (var i = 0; i < headers.length; i++) { if (headers[i] === "Option") optionIdxs.push(i); }
    var out = [];
    for (var r = 2; r < lines.length; r++) {
      if (!lines[r] || !lines[r].trim()) continue;
      var cells = parseCSVLine(lines[r]);
      function get(idx) { return (idx >= 0 && idx < cells.length) ? String(cells[idx] || "").trim() : ""; }
      var rawName = get(studentIdx);
      if (!rawName || rawName.toLowerCase() === "x") continue;
      var opts = [];
      var seen = {};
      var subjects = {};
      optionIdxs.forEach(function (oi) {
        var subj = get(oi);
        if (!subj) return;
        if (!seen[subj]) { seen[subj] = true; opts.push(subj); }
        var nextH = headers[oi + 1] || "";
        var fc = (oi + 1 < cells.length) ? String(cells[oi + 1] || "").trim() : "";
        // Forecast col = idx+1 after each Option; verify header includes "Forecast".
        // First occurrence wins: Option blocks repeat per term (1.1 26/27 first =
        // current year, then older 2.2 25/26) — keep the current-year forecast.
        if (!(subj in subjects)) subjects[subj] = (nextH.indexOf("Forecast") !== -1) ? fc : "";
      });
      var att = get(attIdx);
      if (att !== "" && att.slice(-1) !== "%") att = att + "%";
      out.push({
        id: rawName.toLowerCase().replace(/[^a-z0-9]+/g, "") || ("row-" + r),
        name: rawName.toUpperCase(),
        homeroom: get(homeroomIdx),
        pathway: get(pathwayIdx),
        gender: get(genderIdx),
        tutor: get(tutorIdx),
        attendance: att,
        options: opts,
        subjects: subjects,
        extra: "Pathway: " + get(pathwayIdx) + " \u2022 Tutor: " + get(tutorIdx)
      });
    }
    return out;
  }

  function refreshFromSheet() {
    return fetchSheetCSV().then(function (text) {
      var rows = parseSheetCSV(text);
      if (!rows.length) throw new Error("sheet parsed to 0 students");
      state.students = rows.map(normalizeStudent);
      state.dataSource = { mode: "LIVE", updatedAt: new Date(), sheetError: "" };
      repopulateFilters();
      if (state.network) refreshVisGraph();
      if (state.fallback) state.fallback.refresh();
      updateStats();
      if (state.students.length) selectNode(state.students[0].id);
      return state.students;
    }).catch(function (e) {
      console.warn("Refresh from sheet failed:", e);
      state.dataSource = state.dataSource || { mode: "LOCAL" };
      state.dataSource.sheetError = String((e && e.message) || e);
      updateStats();
      throw e;
    });
  }

  function importCSVFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var rows = parseCSV(reader.result || "");
        if (!rows.length) { alert("No student rows found in CSV."); return; }
        // merge: replace same-id, else append
        rows.forEach(function (row) {
          var s = normalizeStudent(row, state.students.length);
          var ix = -1;
          for (var i = 0; i < state.students.length; i++) {
            if (state.students[i].id === s.id) { ix = i; break; }
          }
          if (ix >= 0) state.students[ix] = s;
          else state.students.push(s);
        });
        repopulateFilters();
        if (state.network) refreshVisGraph();
        if (state.fallback) state.fallback.refresh();
        updateStats();
        if (state.students.length) selectNode(state.students[0].id);
      } catch (e) {
        console.error(e);
        alert("Could not parse CSV: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  /* ============================================================
     Loading
     ============================================================ */
  /* Chain: LIVE sheet -> notes/students.json -> FALLBACK_STUDENTS. */
  function loadStudents() {
    return fetchSheetCSV()
      .then(function (text) {
        var rows = parseSheetCSV(text);
        if (!rows.length) throw new Error("sheet parsed to 0 students");
        state.dataSource = { mode: "LIVE", updatedAt: new Date(), sheetError: "" };
        return rows.map(normalizeStudent);
      })
      .catch(function (sheetErr) {
        var msg = String((sheetErr && sheetErr.message) || sheetErr);
        return fetch("notes/students.json")
          .then(function (r) { if (!r.ok) throw new Error("no students.json"); return r.json(); })
          .then(function (j) {
            var arr = Array.isArray(j) ? j : (j.students || []);
            if (!arr.length) throw new Error("empty");
            state.dataSource = { mode: "LOCAL", updatedAt: null, sheetError: msg };
            return arr.map(normalizeStudent);
          })
          .catch(function () {
            // file:// fallback — embedded copy
            state.dataSource = { mode: "FALLBACK", updatedAt: null, sheetError: msg };
            return FALLBACK_STUDENTS.map(normalizeStudent);
          });
      });
  }

  function fmtTime(d) {
    try {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) { return String(d); }
  }

  function updateStats() {
    var visCount = state.students.filter(studentVisible).length;
    var edgeCount = (state.lastEdges || []).length;
    var ds = state.dataSource;
    if (ds && ds.mode === "LIVE") {
      var t = ds.updatedAt ? " \u2022 updated " + fmtTime(ds.updatedAt) : "";
      statsEl.textContent = "LIVE " + state.students.length + " students" + t +
        " \u2022 " + edgeCount + " links (" + state.edgeMode + ") \u2022 showing " + visCount;
    } else if (ds && (ds.mode === "LOCAL" || ds.mode === "FALLBACK")) {
      statsEl.textContent = "LOCAL FALLBACK \u2022 " + state.students.length + " students \u2022 " +
        edgeCount + " links (" + state.edgeMode + ") \u2022 showing " + visCount +
        (ds.sheetError ? " \u2022 sheet: " + ds.sheetError : "");
    } else {
      statsEl.textContent = state.students.length + " students \u2022 " + edgeCount +
        " links (" + state.edgeMode + ") \u2022 showing " + visCount;
    }
  }

  /* ============================================================
     Events + boot
     ============================================================ */
  function bindEvents() {
    if (searchEl) {
      searchEl.placeholder = "🔍 Search students…";
      searchEl.addEventListener("input", function () {
        state.searchQuery = searchEl.value;
        applyFilters();
      });
    }
    if (addBtn) {
      addBtn.title = "Add a student";
      addBtn.addEventListener("click", function () {
        var name = prompt("New student name:");
        if (!name || !name.trim()) return;
        var s = normalizeStudent({
          name: name.trim().toUpperCase(), homeroom: "11.1", pathway: "",
          gender: "", tutor: "", attendance: "", options: [], subjects: {}, extra: ""
        }, state.students.length);
        state.students.push(s);
        repopulateFilters();
        if (state.network) refreshVisGraph();
        if (state.fallback) state.fallback.refresh();
        updateStats();
        selectNode(s.id);
      });
    }
  }

  function boot() {
    setupControls();
    bindEvents();
    loadStudents().then(function (students) {
      state.students = students;
      repopulateFilters();
      buildGraph();
      // prime edge count for footer before first stats paint
      graphData();
      updateStats();
      if (students.length) selectNode(students[0].id);
    }).catch(function (e) {
      console.error(e);
      previewEl.innerHTML = "<p>Failed to load students.</p>";
    });
  }

  boot();
})();
