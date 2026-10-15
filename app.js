/*
  This page reads its words from the spreadsheets in the "content" folder.
  Edit those files to change the text. Edit this file only to change how things work.
*/
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var SITE = {};

  /* ---------- reading spreadsheet files ---------- */
  function parseCSV(text) {
    text = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
    var first = text.split("\n", 1)[0];
    var commas = (first.match(/,/g) || []).length;
    var semis = (first.match(/;/g) || []).length;
    var tabs = (first.match(/\t/g) || []).length;
    var d = ",";
    if (semis > commas && semis >= tabs) d = ";";
    else if (tabs > commas) d = "\t";
    var rows = [], row = [], field = "", inQ = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (inQ) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQ = false;
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === d) { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    var head = (rows.shift() || []).map(function (h) { return h.trim().toLowerCase(); });
    return rows
      .filter(function (r) {
        var firstCell = (r.filter(function (x) { return x.trim(); })[0] || "").trim();
        return firstCell && firstCell.charAt(0) !== "#";
      })
      .map(function (r) {
        var o = {};
        head.forEach(function (h, j) { o[h] = (r[j] || "").trim(); });
        return o;
      });
  }

  function load(name, required) {
    return fetch("content/" + name + ".csv", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(name); return r.text(); })
      .then(parseCSV)
      .catch(function (e) { if (required) throw e; return []; });
  }

  /* ---------- small helpers ---------- */
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function byId(id) { return document.getElementById(id); }
  function isUrl(u) { return /^https?:\/\//i.test(u || ""); }

  /* **bold** and [link text](https://address) inside any cell */
  function inline(parent, text) {
    var re = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g, last = 0, m;
    text = text || "";
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      var tok = m[0];
      if (tok.indexOf("**") === 0) parent.appendChild(h("strong", null, tok.slice(2, -2)));
      else {
        var mm = /^\[([^\]]+)\]\((.+)\)$/.exec(tok);
        var a = h("a", null, mm[1]);
        a.href = mm[2]; a.target = "_blank"; a.rel = "noopener";
        parent.appendChild(a);
      }
      last = m.index + tok.length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
    return parent;
  }

  function shown(el, yes) { if (el) el.hidden = !yes; }

  function imgPath(v) {
    v = (v || "").trim();
    if (!v || v.indexOf("..") > -1) return "";
    if (isUrl(v)) return v;
    if (v.charAt(0) === "/") v = v.slice(1);
    return v.indexOf("/") > -1 ? v : "images/" + v;
  }

  function when(s) {
    var m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec((s || "").trim());
    var d = m ? new Date(+m[1], +m[2] - 1, +(m[3] || 1)) : new Date(s);
    return isNaN(d) ? null : d;
  }

  /* ---------- diagrams ---------- */
  function sv(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgText(parent, cls, x, y, text) {
    var t = sv("text", { x: x, y: y, "text-anchor": "middle" }, parent);
    if (cls) t.setAttribute("class", cls);
    t.textContent = text;
  }

  function hubsSvg(compact, caps) {
    var svg = sv("svg", { viewBox: compact ? "0 0 216 75" : "0 0 720 250" });
    var g = compact ? sv("g", { transform: "scale(0.3)" }, svg) : svg;
    function star(cx, cy, pts, hubR) {
      pts.forEach(function (p) { sv("line", { "class": "ln", x1: cx, y1: cy, x2: cx + p[0], y2: cy + p[1] }, g); });
      pts.forEach(function (p) { sv("circle", { "class": "dot", cx: cx + p[0], cy: cy + p[1], r: 6 }, g); });
      sv("circle", { "class": "hub", cx: cx, cy: cy, r: hubR }, g);
    }
    var ring = [];
    for (var a = -90; a < 270; a += 60) ring.push([Math.round(85 * Math.cos(a * Math.PI / 180)), Math.round(85 * Math.sin(a * Math.PI / 180))]);
    star(170, 110, ring, 16);
    star(465, 85, [[-40, -25], [-35, 30], [30, -25]], 11);
    star(610, 75, [[40, -25], [45, 25], [-30, -35]], 11);
    star(540, 175, [[-40, 30], [40, 30], [5, -45]], 11);
    if (!compact) {
      svgText(g, "cap", 170, 238, caps[0] || "");
      svgText(g, "cap", 545, 238, caps[1] || "");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Diagram. " + (caps[0] || "") + " on the left, " + (caps[1] || "") + " on the right.");
    } else {
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
    }
    return svg;
  }

  function ecoSvg(center, labels, compact) {
    var svg = sv("svg", { viewBox: compact ? "0 0 216 90" : "0 0 720 300" });
    var g = compact ? sv("g", { transform: "scale(0.3)" }, svg) : svg;
    var cx = 360, cy = 150, rx = 250, ry = 105, n = labels.length, pos = [], i;
    for (i = 0; i < n; i++) {
      var ang = (-90 + i * 360 / n) * Math.PI / 180;
      pos.push([Math.round(cx + rx * Math.cos(ang)), Math.round(cy + ry * Math.sin(ang))]);
    }
    pos.forEach(function (p) { sv("line", { "class": "ln", x1: cx, y1: cy, x2: p[0], y2: p[1] }, g); });
    if (compact) {
      pos.forEach(function (p) { sv("circle", { "class": "dot", cx: p[0], cy: p[1], r: 24 }, g); });
      sv("circle", { "class": "hub", cx: cx, cy: cy, r: 46 }, g);
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      return svg;
    }
    pos.forEach(function (p, j) {
      var w = Math.round(labels[j].length * 7.6 + 30);
      sv("rect", { "class": "pill", x: p[0] - Math.floor(w / 2), y: p[1] - 17, width: w, height: 34, rx: 17 }, g);
      svgText(g, "", p[0], p[1] + 4.5, labels[j]);
    });
    sv("circle", { "class": "hub", cx: cx, cy: cy, r: 48 }, g);
    var lines = center.split("|");
    lines.forEach(function (t, j) {
      svgText(g, "ctr", cx, cy + (j - (lines.length - 1) / 2) * 16 + 4.5, t);
    });
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Diagram. " + lines.join(" ") + " at the center, connected to " + labels.join(", ") + ".");
    return svg;
  }

  /* ---------- case page rows ---------- */
  function caseRows(all, slug) { return all.filter(function (r) { return r.case === slug; }); }

  function firstDiagram(rows) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].kind === "diagram-hubs") return { kind: "hubs", caps: (rows[i].label || "").split("|") };
      if (rows[i].kind === "diagram-eco") {
        var nodes = [];
        for (var j = i + 1; j < rows.length && rows[j].kind === "node"; j++) nodes.push(rows[j].text);
        return { kind: "eco", center: rows[i].label, nodes: nodes };
      }
    }
    return null;
  }

  /* ---------- shared pieces ---------- */
  function applySite() {
    var p = (SITE.palette || "ochre").toLowerCase();
    if (p === "walnut") document.documentElement.removeAttribute("data-palette");
    else document.documentElement.setAttribute("data-palette", p);
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var v = SITE[el.getAttribute("data-site")];
      if (v) el.textContent = v;
    });
    var foot = byId("site-footer");
    if (foot) {
      foot.textContent = "";
      foot.appendChild(h("span", null, "© " + (SITE.site_name || "")));
      var links = h("span");
      [["LinkedIn", SITE.linkedin_url], ["Medium", SITE.medium_url], ["Substack", SITE.substack_url]].forEach(function (l) {
        if (!isUrl(l[1])) return;
        var a = h("a", null, l[0]);
        a.href = l[1]; a.target = "_blank"; a.rel = "noopener";
        if (links.childNodes.length) links.appendChild(document.createTextNode("  "));
        links.appendChild(a);
      });
      foot.appendChild(links);
    }
  }

  function tryImages(slug, done) {
    var exts = ["jpg", "png"];
    (function next(i) {
      if (i >= exts.length) return;
      var im = new Image();
      im.alt = "";
      im.onload = function () { done(im); };
      im.onerror = function () { next(i + 1); };
      im.src = "images/" + slug + "." + exts[i];
    })(0);
  }

  /* ---------- home page ---------- */
  function renderHome(d) {
    byId("headline").textContent = SITE.headline || SITE.site_name || "";
    var intro = byId("intro");
    Object.keys(SITE).filter(function (k) { return /^intro_\d+$/.test(k); }).sort().forEach(function (k) {
      if (SITE[k]) intro.appendChild(inline(h("p"), SITE[k]));
    });

    var about = byId("about-body");
    d.about.forEach(function (r) { if (r.text) about.appendChild(inline(h("p"), r.text)); });
    shown(byId("about"), about.childNodes.length > 0);

    var bring = byId("bring-list");
    d.bring.forEach(function (r) {
      var box = h("div");
      box.appendChild(h("h3", null, r.title));
      box.appendChild(inline(h("p"), r.text));
      bring.appendChild(box);
    });
    shown(byId("bring"), d.bring.length > 0);

    var list = byId("cases-list");
    d.cases.forEach(function (c) {
      var a = h("a", "case");
      a.href = c.slug + ".html";
      var txt = h("div", "txt");
      txt.appendChild(h("div", "meta", c.company));
      txt.appendChild(h("h3", null, c.title));
      if (c.blurb) txt.appendChild(h("p", null, c.blurb));
      if (c.result) txt.appendChild(h("p", "res", c.result));
      txt.appendChild(h("span", "go", "Read the case"));
      a.appendChild(txt);
      var dg = firstDiagram(caseRows(d.casePages, c.slug));
      var thumb = h("span", "thumb");
      if (dg) thumb.appendChild(dg.kind === "hubs" ? hubsSvg(true, dg.caps) : ecoSvg(dg.center, dg.nodes, true));
      a.appendChild(thumb);
      if (!dg) a.classList.add("no-thumb");
      tryImages(c.slug, function (im) {
        thumb.textContent = "";
        thumb.classList.add("is-photo");
        thumb.appendChild(im);
        a.classList.remove("no-thumb");
      });
      list.appendChild(a);
    });
    shown(byId("work"), d.cases.length > 0);

    renderWriting(d.writing);

    var built = byId("built-body");
    d.built.forEach(function (r) {
      var p = h("p");
      p.appendChild(h("strong", null, r.name + "."));
      p.appendChild(document.createTextNode(" "));
      inline(p, r.text);
      built.appendChild(p);
    });
    shown(byId("built"), d.built.length > 0);

    var lede = byId("contact-text");
    lede.textContent = SITE.contact_text || "";
    var btn = byId("contact-btn");
    if (isUrl(SITE.linkedin_url) && SITE.contact_button) {
      btn.href = SITE.linkedin_url;
      btn.textContent = SITE.contact_button;
    } else btn.hidden = true;
    var em = byId("email-line");
    if (SITE.email) { em.hidden = false; em.querySelector("span").textContent = SITE.email; }

    var about2 = document.querySelector(".sec.about");
    var img = new Image();
    img.alt = SITE.site_name || "";
    img.onload = function () {
      var fig = h("figure", "portrait");
      fig.appendChild(img);
      about2.appendChild(fig);
    };
    img.src = "photo.jpg";
  }

  function renderWriting(items) {
    var host = byId("writing-list");
    var max = parseInt(SITE.max_writing_items, 10) || 6;
    items = items.filter(function (it) { return isUrl(it.url) && it.title; })
      .sort(function (a, b) { return ((when(b.date) || 0) - (when(a.date) || 0)); })
      .slice(0, max);
    shown(byId("writing"), items.length > 0);
    if (!items.length) return;
    var ul = h("ul", "writing");
    items.forEach(function (it) {
      var li = h("li");
      var d = when(it.date), label = it.date;
      if (d) { try { label = d.toLocaleDateString("en-CA", { month: "short", year: "numeric" }); } catch (e) {} }
      li.appendChild(h("span", "when", label || ""));
      var main = h("div");
      var a = h("a", "t", it.title);
      a.href = it.url; a.target = "_blank"; a.rel = "noopener";
      main.appendChild(a);
      if (it.source) main.appendChild(h("span", "src", it.source));
      if (it.note) main.appendChild(h("p", "n", it.note));
      li.appendChild(main);
      var src = imgPath(it.image);
      if (src) {
        var pic = new Image();
        pic.alt = "";
        pic.onload = function () {
          var f = h("figure", "pic");
          f.appendChild(pic);
          li.appendChild(f);
          li.classList.add("has-img");
        };
        pic.src = src;
      }
      ul.appendChild(li);
    });
    host.appendChild(ul);
    if (isUrl(SITE.substack_url)) {
      var more = h("p", "more");
      var m = h("a", null, "All writing on Substack");
      m.href = SITE.substack_url; m.target = "_blank"; m.rel = "noopener";
      more.appendChild(m);
      host.appendChild(more);
    }
  }

  /* ---------- case page ---------- */
  function renderCase(d, slug) {
    var idx = -1;
    d.cases.forEach(function (c, i) { if (c.slug === slug) idx = i; });
    if (idx < 0) {
      byId("case-hero-title").textContent = "This case study is not in cases.csv yet.";
      return;
    }
    var c = d.cases[idx];
    document.title = c.title + " | " + (SITE.site_name || "");
    byId("case-hero-title").textContent = c.title;

    var rows = caseRows(d.casePages, slug);
    var facts = byId("case-facts");
    var body = byId("case-body");
    var sec = null, prose = null, ul = null, i;

    function startSection(name) {
      sec = h("section", "sec");
      sec.appendChild(h("h2", null, name));
      prose = h("div", "body wide prose");
      sec.appendChild(prose);
      body.appendChild(sec);
      ul = null;
    }
    function ensureSection() { if (!sec) startSection(""); }

    for (i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.kind === "fact") {
        var div = h("div");
        div.appendChild(h("dt", null, r.label));
        div.appendChild(h("dd", null, r.text));
        facts.appendChild(div);
      } else if (r.kind === "section") {
        startSection(r.text);
      } else if (r.kind === "p" || r.kind === "note") {
        ensureSection(); ul = null;
        prose.appendChild(inline(h("p", r.kind === "note" ? "note" : null), r.text));
      } else if (r.kind === "li") {
        ensureSection();
        if (!ul) { ul = h("ul"); prose.appendChild(ul); }
        ul.appendChild(inline(h("li"), r.text));
      } else if (r.kind === "diagram-hubs" || r.kind === "diagram-eco") {
        ensureSection(); ul = null;
        var fig = h("figure", "dg");
        if (r.kind === "diagram-hubs") fig.appendChild(hubsSvg(false, (r.label || "").split("|")));
        else {
          var nodes = [];
          while (rows[i + 1] && rows[i + 1].kind === "node") { nodes.push(rows[i + 1].text); i++; }
          fig.appendChild(ecoSvg(r.label, nodes, false));
        }
        fig.appendChild(h("figcaption", null, r.text));
        prose.appendChild(fig);
      }
    }

    var next = d.cases[(idx + 1) % d.cases.length];
    var nx = byId("case-next");
    if (next && next.slug !== slug) {
      var box = h("div", "nx");
      box.appendChild(h("span", "cap", "Next case study"));
      var a = h("a", "nt", next.title);
      a.href = next.slug + ".html";
      box.appendChild(a);
      nx.appendChild(box);
    }
    window.scrollTo(0, 0);
  }

  /* ---------- start ---------- */
  var slug = document.body.getAttribute("data-case");
  var names = slug ? ["cases", "case_pages"] : ["about", "bring", "cases", "case_pages", "writing", "built"];

  Promise.all([load("site", true)].concat(names.map(function (n) { return load(n); })))
    .then(function (res) {
      res[0].forEach(function (r) { if (r.key) SITE[r.key] = r.value; });
      var d = {};
      names.forEach(function (n, i) { d[n.replace(/_(\w)/, function (_, c) { return c.toUpperCase(); })] = res[i + 1]; });
      applySite();
      if (slug) renderCase(d, slug); else renderHome(d);
    })
    .catch(function () {
      var box = byId("load-error");
      if (box) box.hidden = false;
    });
})();
