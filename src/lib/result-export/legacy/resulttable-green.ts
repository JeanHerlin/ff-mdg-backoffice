// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isChampionTeam, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Result Table" — gold-on-black two-column result table with
   diagonal corner brackets. Same data & 18-team cap as Rank Table, just a
   different visual theme. All text is pulled live from state. ---- */
export function renderResultTableDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  rowsPerCol = rowsPerCol || 9; // default: 2 columns x 9 rows = 18 teams per table/image
  const leftRanks  = ranks.slice(0, rowsPerCol);
  const rightRanks = ranks.slice(rowsPerCol, rowsPerCol*2);
  const leftLogos  = logos.slice(0, rowsPerCol);
  const rightLogos = logos.slice(rowsPerCol, rowsPerCol*2);
  const numRows = Math.max(leftRanks.length, rightRanks.length, 1);

  const baseWidth = 1536;
  const outerPad = 46;
  const headerH = 200;
  const colHeadH = 56;
  const rowH = 64;
  const midGap = 72;
  const footerH = 68 + (sponsorLogos.length ? 56 : 0); // extra room for the sponsor/partner logo row
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 40;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: matte black with a faint warm glow ---- */
  ctx.fillStyle = "#0a0906";
  ctx.fillRect(0,0,width,height);
  const glow = ctx.createRadialGradient(width*0.5,0,0,width*0.5,0,width*0.6);
  glow.addColorStop(0,"rgba(143,211,49,0.10)");
  glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,width,height);

  /* ---- gold double-line diagonal corner brackets (all four corners) ---- */
  function cornerBracket(cx0,cy0,flipX,flipY){
    ctx.save();
    ctx.translate(cx0,cy0);
    ctx.scale(flipX?-1:1, flipY?-1:1);
    ctx.strokeStyle = "#8fd331";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(4,60); ctx.lineTo(60,4); ctx.stroke();
    ctx.strokeStyle = "#6fae28";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(4,78); ctx.lineTo(78,4); ctx.stroke();
    ctx.restore();
  }
  cornerBracket(0,0,false,false);
  cornerBracket(width,0,true,false);
  cornerBracket(0,height,false,true);
  cornerBracket(width,height,true,true);

  /* ---- title block ---- */
  ctx.textAlign = "center";

  ctx.save();
  ctx.shadowColor = "rgba(143,211,49,0.35)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#f4f0e6";
  ctx.font = "800 54px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-320), width/2, 106);
  ctx.restore();

  // Subtitle badge — left blank (no pill drawn) unless the user set one,
  // so a table without a season/event name doesn't show placeholder text.
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
    const seasonW = ctx.measureText(seasonLabel).width + 34;
    roundRectPath(ctx, width/2-seasonW/2, 124, seasonW, 30, 15);
    ctx.strokeStyle = "rgba(143,211,49,0.6)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#8fd331";
    ctx.fillText(seasonLabel, width/2, 144);
  }

  if(champRush){
    ctx.font = "800 17px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#c7f08a";
    drawIconTextLine(ctx, width/2, seasonLabel ? 178 : 152, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:20});
  }

  /* ---- shared column geometry ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
  drawPlayerPhoto(ctx, photo, [[leftX, headerH, colW, tableH],[rightX, headerH, colW, tableH]]);
  const rankW=68, matchesW=94, killsW=90, booyahW=100, ptsW=120;
  const teamW = colW - rankW - matchesW - killsW - booyahW - ptsW;

  function colXOf(x0){
    return {
      rank: x0,
      team: x0+rankW,
      matches: x0+rankW+teamW,
      kills: x0+rankW+teamW+matchesW,
      booyah: x0+rankW+teamW+matchesW+killsW,
      pts: x0+rankW+teamW+matchesW+killsW+booyahW
    };
  }

  function drawColumnHeader(x0){
    const headY = headerH;
    roundRectPath(ctx, x0, headY, colW, colHeadH, 8);
    ctx.strokeStyle = "rgba(143,211,49,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const cx = colXOf(x0);
    const midY = headY+colHeadH/2+5;
    ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#f4f0e6";
    ctx.textAlign = "center";
    ctx.fillText("#", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    drawIconTextLine(ctx, cx.matches+matchesW/2, midY, [{icon:"gamepad"},{text:"MATCHES"}], {iconSize:11});
    drawIconTextLine(ctx, cx.kills+killsW/2, midY, [{icon:"target"},{text:"KILLS"}], {iconSize:11});
    ctx.fillStyle = "#8fd331";
    drawIconTextLine(ctx, cx.booyah+booyahW/2, midY, [{icon:"trophy"},{text:"BOOYAH!"}], {iconSize:11});
    ctx.fillText("POINTS", cx.pts+ptsW/2, midY);
  }

  const pointColors = ["#8fd331","#86cf70","#2ecc71","#ff5d5d","#52c878","#75e06f","#ff8fa3","#8fd331","#f4f0e6"];

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    const cx = colXOf(x0);
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isChamp = isChampionTeam(r.totalPoints);
      const isActChamp = isActualChampion(r.team.id);
      const rowY = headerH + colHeadH + i*rowH;
      const midY = rowY + rowH/2 + 6;

      // row card
      roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fill();
      ctx.strokeStyle = "rgba(143,211,49,0.15)";
      ctx.lineWidth = 1;
      roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
      ctx.stroke();
      if(isActChamp){
        ctx.fillStyle = "rgba(143,211,49,0.10)";
        roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
        ctx.fill();
      }else if(isChamp){
        // "In line" for Champion Rush but hasn't won yet — a soft glow only,
        // no crown badge (reserved for actual Champions).
        ctx.save();
        ctx.shadowColor = "rgba(143,211,49,0.6)";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = "rgba(143,211,49,0.55)";
        ctx.lineWidth = 1.4;
        roundRectPath(ctx, x0+1, rowY+5, colW-2, rowH-10, 8);
        ctx.stroke();
        ctx.restore();
      }

      // rank box (filled for #1, outlined for #2/#3, plain for the rest)
      const rankBoxX = x0+6, rankBoxW = rankW-10, rankBoxY = rowY+10, rankBoxH = rowH-20;
      let rankFill = null, rankStroke = "rgba(255,255,255,0.12)", numColor = "#f4f0e6";
      if(globalRank===0){ rankFill = "#8fd331"; numColor = "#1a1207"; }
      else if(globalRank===1){ rankStroke = "#c9d2e0"; numColor = "#c9d2e0"; }
      else if(globalRank===2){ rankStroke = "#76c944"; numColor = "#76c944"; }
      roundRectPath(ctx, rankBoxX, rankBoxY, rankBoxW, rankBoxH, 6);
      if(rankFill){ ctx.fillStyle = rankFill; ctx.fill(); }
      ctx.strokeStyle = rankStroke;
      ctx.lineWidth = 1.4;
      roundRectPath(ctx, rankBoxX, rankBoxY, rankBoxW, rankBoxH, 6);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "800 20px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillStyle = numColor;
      ctx.fillText(String(globalRank+1), rankBoxX+rankBoxW/2, midY-3);

      // team logo
      const logoR = 20, logoCx = cx.team+26, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1c1a12";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#8fd331";
        ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(143,211,49,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.stroke();

      // team name (editable — pulled straight from the team record)
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? "#8fd331" : "#f4f0e6";
      ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+22) - (isActChamp?26:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+14, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#c7f08a");
      }

      // stat columns
      ctx.textAlign = "center";
      ctx.fillStyle = "#d8d2c4";
      ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.matches), cx.matches+matchesW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillStyle = "#8fd331";
      ctx.fillText(String(r.wins), cx.booyah+booyahW/2, midY);

      // points — colour cycles per row like the reference design, gold for rank #1
      ctx.fillStyle = globalRank===0 ? "#8fd331" : pointColors[globalRank % pointColors.length];
      ctx.font = "800 21px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.pts+ptsW/2, midY);
    }
  }

  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  // center divider with tournament-logo emblem
  ctx.strokeStyle = "rgba(143,211,49,0.3)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2,6]);
  ctx.beginPath();
  ctx.moveTo(midX, headerH);
  ctx.lineTo(midX, headerH+tableH);
  ctx.stroke();
  ctx.setLineDash([]);

  const emY = headerH+tableH/2, emR = 20;
  ctx.save();
  ctx.translate(midX, emY);
  ctx.rotate(Math.PI/4);
  ctx.fillStyle = "#1a1509";
  roundRectPath(ctx, -emR, -emR, emR*2, emR*2, 6);
  ctx.fill();
  ctx.strokeStyle = "#8fd331";
  ctx.lineWidth = 1.4;
  roundRectPath(ctx, -emR, -emR, emR*2, emR*2, 6);
  ctx.stroke();
  ctx.restore();
  if(tourneyLogo){
    ctx.save();
    ctx.beginPath();
    ctx.arc(midX, emY, emR-4, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(tourneyLogo, midX-(emR-4), emY-(emR-4), (emR-4)*2, (emR-4)*2);
    ctx.restore();
  }

  /* ---- footer: gold arrow accents flanking an optional tagline ---- */
  const footY = headerH+tableH+24;
  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#8fd331";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+32);
    const tagW = ctx.measureText(tagline).width;

    function footerArrow(cx0, dir){
      ctx.save();
      ctx.translate(cx0, footY+27);
      ctx.fillStyle = "#8fd331";
      ctx.beginPath();
      if(dir>0){ ctx.moveTo(0,-7); ctx.lineTo(14,0); ctx.lineTo(0,7); }
      else{ ctx.moveTo(0,-7); ctx.lineTo(-14,0); ctx.lineTo(0,7); }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    footerArrow(width/2-tagW/2-26, -1);
    footerArrow(width/2+tagW/2+26, 1);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8fd331";
    ctx.fillText(dateLabel, outerPad, footY+34);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#5f7f44";
    ctx.fillText(pageLabel, width-outerPad, footY+32);
  }

  if(sponsorLogos.length){
    // 0 to many partner logos, laid out right-to-left along the footer.
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 16 : 20;
    const gap = 12;
    const sLogoCy = footY + 32 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#5f7f44";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1509";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#8fd331";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- Green Result Table design (lime-on-black, FI corner marks) ----
   Mirrors renderResultTableDesign's layout/geometry but with a green
   palette and no forced fallback copy: title/subtitle/tagline render
   only when the user actually filled them in via the design modal. */
export function renderGreenTableDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  rowsPerCol = rowsPerCol || 9; // default: 2 columns x 9 rows = 18 teams per table/image
  const leftRanks  = ranks.slice(0, rowsPerCol);
  const rightRanks = ranks.slice(rowsPerCol, rowsPerCol*2);
  const leftLogos  = logos.slice(0, rowsPerCol);
  const rightLogos = logos.slice(rowsPerCol, rowsPerCol*2);
  const numRows = Math.max(leftRanks.length, rightRanks.length, 1);

  const LIME = "#8fd331";
  const LIME_DIM = "#3c7d16";

  const baseWidth = 1536;
  const outerPad = 46;
  const headerH = 200;
  const colHeadH = 56;
  const rowH = 64;
  const midGap = 72;
  const footerH = 68 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 40;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: matte near-black with a faint green glow ---- */
  ctx.fillStyle = "#070a05";
  ctx.fillRect(0,0,width,height);
  const glow = ctx.createRadialGradient(width*0.5,0,0,width*0.5,0,width*0.6);
  glow.addColorStop(0,"rgba(140,230,60,0.10)");
  glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,width,height);

  /* ---- corner "FI" marks (thick diagonal lime slash + dot, echoing the
     Free Fire flame wordmark) instead of the gold bracket corners ---- */
  function fiMark(cx0,cy0,flipX){
    ctx.save();
    ctx.translate(cx0,cy0);
    ctx.scale(flipX?-1:1,1);
    ctx.strokeStyle = LIME;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(10,54); ctx.lineTo(38,10); ctx.stroke();
    ctx.fillStyle = LIME;
    ctx.beginPath(); ctx.arc(46,10,6,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  fiMark(26,20,false);
  fiMark(width-26,20,true);

  /* ---- title block ---- */
  ctx.textAlign = "center";

  ctx.save();
  ctx.shadowColor = "rgba(140,230,60,0.35)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#eef4e2";
  ctx.font = "800 54px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-320), width/2, 104);
  ctx.restore();

  // Subtitle badge — left blank (no pill drawn) unless the user set one,
  // so a table without a season/event name doesn't show placeholder text.
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
    const seasonW = ctx.measureText(seasonLabel).width + 34;
    roundRectPath(ctx, width/2-seasonW/2, 124, seasonW, 30, 15);
    ctx.strokeStyle = "rgba(140,230,60,0.6)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = LIME;
    ctx.fillText(seasonLabel, width/2, 144);
  }

  if(champRush){
    ctx.font = "800 17px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#c7f08a";
    drawIconTextLine(ctx, width/2, seasonLabel ? 178 : 152, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:20});
  }

  /* ---- shared column geometry ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
  drawPlayerPhoto(ctx, photo, [[leftX, headerH, colW, tableH],[rightX, headerH, colW, tableH]]);
  const rankW=68, matchesW=94, killsW=90, booyahW=100, ptsW=120;
  const teamW = colW - rankW - matchesW - killsW - booyahW - ptsW;

  function colXOf(x0){
    return {
      rank: x0,
      team: x0+rankW,
      matches: x0+rankW+teamW,
      kills: x0+rankW+teamW+matchesW,
      booyah: x0+rankW+teamW+matchesW+killsW,
      pts: x0+rankW+teamW+matchesW+killsW+booyahW
    };
  }

  function drawColumnHeader(x0){
    const headY = headerH;
    roundRectPath(ctx, x0, headY, colW, colHeadH, 8);
    ctx.fillStyle = "rgba(140,230,60,0.10)";
    ctx.fill();
    ctx.strokeStyle = "rgba(140,230,60,0.35)";
    ctx.lineWidth = 1;
    roundRectPath(ctx, x0, headY, colW, colHeadH, 8);
    ctx.stroke();

    const cx = colXOf(x0);
    const midY = headY+colHeadH/2+5;
    ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#eef4e2";
    ctx.textAlign = "center";
    ctx.fillText("#", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    drawIconTextLine(ctx, cx.matches+matchesW/2, midY, [{icon:"gamepad"},{text:"MATCHES"}], {iconSize:11});
    drawIconTextLine(ctx, cx.kills+killsW/2, midY, [{icon:"target"},{text:"KILLS"}], {iconSize:11});
    ctx.fillStyle = LIME;
    drawIconTextLine(ctx, cx.booyah+booyahW/2, midY, [{icon:"trophy"},{text:"BOOYAH!"}], {iconSize:11});
    ctx.fillText("POINTS", cx.pts+ptsW/2, midY);
  }

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    const cx = colXOf(x0);
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isChamp = isChampionTeam(r.totalPoints);
      const isActChamp = isActualChampion(r.team.id);
      const rowY = headerH + colHeadH + i*rowH;
      const midY = rowY + rowH/2 + 6;

      // row card — subtle alternating stripe like the reference sheet
      roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.025)" : "rgba(140,230,60,0.03)";
      ctx.fill();
      ctx.strokeStyle = "rgba(140,230,60,0.15)";
      ctx.lineWidth = 1;
      roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
      ctx.stroke();
      if(isActChamp){
        ctx.fillStyle = "rgba(140,230,60,0.10)";
        roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
        ctx.fill();
      }else if(isChamp){
        // "In line" for Champion Rush but hasn't won yet — a soft glow only,
        // no crown/trophy badge (reserved for actual Champions below).
        ctx.save();
        ctx.shadowColor = "rgba(140,230,60,0.6)";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = "rgba(140,230,60,0.55)";
        ctx.lineWidth = 1.4;
        roundRectPath(ctx, x0+1, rowY+5, colW-2, rowH-10, 8);
        ctx.stroke();
        ctx.restore();
      }

      // rank number — plain, no box, matching the reference table
      ctx.textAlign = "center";
      ctx.font = "800 22px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillStyle = globalRank<3 ? LIME : "#eef4e2";
      ctx.fillText(String(globalRank+1), x0+rankW/2, midY-3);

      // team logo
      const logoR = 20, logoCx = cx.team+26, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#0d1408";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = LIME;
        ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(140,230,60,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.stroke();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? LIME : "#eef4e2";
      ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+22) - (isActChamp?26:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+14, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, LIME);
      }

      // stat columns
      ctx.textAlign = "center";
      ctx.fillStyle = "#c9d4bd";
      ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.matches), cx.matches+matchesW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillStyle = LIME;
      ctx.fillText(String(r.wins), cx.booyah+booyahW/2, midY);

      // points — lime, brighter for the top row
      ctx.fillStyle = LIME;
      ctx.font = "800 21px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.pts+ptsW/2, midY);
    }
  }

  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  // center divider with tournament-logo emblem
  ctx.strokeStyle = "rgba(140,230,60,0.3)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2,6]);
  ctx.beginPath();
  ctx.moveTo(midX, headerH);
  ctx.lineTo(midX, headerH+tableH);
  ctx.stroke();
  ctx.setLineDash([]);

  const emY = headerH+tableH/2, emR = 20;
  ctx.save();
  ctx.translate(midX, emY);
  ctx.rotate(Math.PI/4);
  ctx.fillStyle = "#0d1408";
  roundRectPath(ctx, -emR, -emR, emR*2, emR*2, 6);
  ctx.fill();
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 1.4;
  roundRectPath(ctx, -emR, -emR, emR*2, emR*2, 6);
  ctx.stroke();
  ctx.restore();
  if(tourneyLogo){
    ctx.save();
    ctx.beginPath();
    ctx.arc(midX, emY, emR-4, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(tourneyLogo, midX-(emR-4), emY-(emR-4), (emR-4)*2, (emR-4)*2);
    ctx.restore();
  }

  /* ---- footer: lime arrow accents flanking an optional tagline ---- */
  const footY = headerH+tableH+24;
  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = LIME;
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+32);
    const tagW = ctx.measureText(tagline).width;

    function footerArrow(cx0, dir){
      ctx.save();
      ctx.translate(cx0, footY+27);
      ctx.fillStyle = LIME;
      ctx.beginPath();
      if(dir>0){ ctx.moveTo(0,-7); ctx.lineTo(14,0); ctx.lineTo(0,7); }
      else{ ctx.moveTo(0,-7); ctx.lineTo(-14,0); ctx.lineTo(0,7); }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    footerArrow(width/2-tagW/2-26, -1);
    footerArrow(width/2+tagW/2+26, 1);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = LIME;
    ctx.fillText(dateLabel, outerPad, footY+34);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = LIME_DIM;
    ctx.fillText(pageLabel, width-outerPad, footY+32);
  }

  if(sponsorLogos.length){
    // 0 to many partner logos, laid out right-to-left along the footer.
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 16 : 20;
    const gap = 12;
    const sLogoCy = footY + 32 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = LIME_DIM;
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#0d1408";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = LIME;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Result Table" — two columns x 6 rows (12 teams/image)
   variant. Same theme as renderResultTableDesign, just capped at 6 rows
   per column so a standard 12-team bracket fits neatly. ---- */
export function renderResultTableTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderResultTableDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Result Table" — single wide column, every team listed
   top-to-bottom in ranked order (up to 12 teams/image). Same gold-bracket
   theme and column schema (rank/team/matches/kills/booyah/points) as the
   two-column Result Table design above. ---- */
export function renderResultTableOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 46;
  const headerH = 200;
  const colHeadH = 56;
  const rowH = 66;
  const footerH = 68 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 40;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0906";
  ctx.fillRect(0,0,width,height);
  const glow = ctx.createRadialGradient(width*0.5,0,0,width*0.5,0,width*0.6);
  glow.addColorStop(0,"rgba(143,211,49,0.10)");
  glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,width,height);

  function cornerBracket(cx0,cy0,flipX,flipY){
    ctx.save();
    ctx.translate(cx0,cy0);
    ctx.scale(flipX?-1:1, flipY?-1:1);
    ctx.strokeStyle = "#8fd331";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(4,60); ctx.lineTo(60,4); ctx.stroke();
    ctx.strokeStyle = "#6fae28";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(4,78); ctx.lineTo(78,4); ctx.stroke();
    ctx.restore();
  }
  cornerBracket(0,0,false,false);
  cornerBracket(width,0,true,false);
  cornerBracket(0,height,false,true);
  cornerBracket(width,height,true,true);

  ctx.textAlign = "center";

  ctx.save();
  ctx.shadowColor = "rgba(143,211,49,0.35)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#f4f0e6";
  ctx.font = "800 50px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-260), width/2, 104);
  ctx.restore();

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
    const seasonW = ctx.measureText(seasonLabel).width + 34;
    roundRectPath(ctx, width/2-seasonW/2, 124, seasonW, 30, 15);
    ctx.strokeStyle = "rgba(143,211,49,0.6)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#8fd331";
    ctx.fillText(seasonLabel, width/2, 144);
  }

  if(champRush){
    ctx.font = "800 17px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#c7f08a";
    drawIconTextLine(ctx, width/2, seasonLabel ? 178 : 152, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:20});
  }

  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);
  const rankW=70, matchesW=104, killsW=100, booyahW=112, ptsW=132;
  const teamW = colW - rankW - matchesW - killsW - booyahW - ptsW;
  const cx = {
    rank: x0,
    team: x0+rankW,
    matches: x0+rankW+teamW,
    kills: x0+rankW+teamW+matchesW,
    booyah: x0+rankW+teamW+matchesW+killsW,
    pts: x0+rankW+teamW+matchesW+killsW+booyahW
  };

  const headY = headerH;
  roundRectPath(ctx, x0, headY, colW, colHeadH, 8);
  ctx.strokeStyle = "rgba(143,211,49,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  const headMidY = headY+colHeadH/2+5;
  ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#f4f0e6";
  ctx.textAlign = "center";
  ctx.fillText("#", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  drawIconTextLine(ctx, cx.matches+matchesW/2, headMidY, [{icon:"gamepad"},{text:"MATCHES"}], {iconSize:11});
  drawIconTextLine(ctx, cx.kills+killsW/2, headMidY, [{icon:"target"},{text:"KILLS"}], {iconSize:11});
  ctx.fillStyle = "#8fd331";
  drawIconTextLine(ctx, cx.booyah+booyahW/2, headMidY, [{icon:"trophy"},{text:"BOOYAH!"}], {iconSize:11});
  ctx.fillStyle = "#f4f0e6";
  ctx.fillText("POINTS", cx.pts+ptsW/2, headMidY);

  const pointColors = ["#8fd331","#86cf70","#2ecc71","#ff5d5d","#52c878","#75e06f","#ff8fa3","#8fd331","#f4f0e6"];

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isChamp = isChampionTeam(r.totalPoints);
    const isActChamp = isActualChampion(r.team.id);
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fill();
    ctx.strokeStyle = "rgba(143,211,49,0.15)";
    ctx.lineWidth = 1;
    roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
    ctx.stroke();
    if(isActChamp){
      ctx.fillStyle = "rgba(143,211,49,0.10)";
      roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
      ctx.fill();
    }else if(isChamp){
      ctx.save();
      ctx.shadowColor = "rgba(143,211,49,0.6)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "rgba(143,211,49,0.55)";
      ctx.lineWidth = 1.4;
      roundRectPath(ctx, x0+1, rowY+5, colW-2, rowH-10, 8);
      ctx.stroke();
      ctx.restore();
    }

    const rankBoxX = x0+6, rankBoxW = rankW-10, rankBoxY = rowY+10, rankBoxH = rowH-20;
    let rankFill = null, rankStroke = "rgba(255,255,255,0.12)", numColor = "#f4f0e6";
    if(globalRank===0){ rankFill = "#8fd331"; numColor = "#1a1207"; }
    else if(globalRank===1){ rankStroke = "#c9d2e0"; numColor = "#c9d2e0"; }
    else if(globalRank===2){ rankStroke = "#76c944"; numColor = "#76c944"; }
    roundRectPath(ctx, rankBoxX, rankBoxY, rankBoxW, rankBoxH, 6);
    if(rankFill){ ctx.fillStyle = rankFill; ctx.fill(); }
    ctx.strokeStyle = rankStroke;
    ctx.lineWidth = 1.4;
    roundRectPath(ctx, rankBoxX, rankBoxY, rankBoxW, rankBoxH, 6);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "800 20px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = numColor;
    ctx.fillText(String(globalRank+1), rankBoxX+rankBoxW/2, midY-3);

    const logoR = 21, logoCx = cx.team+27, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1c1a12";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#8fd331";
      ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(143,211,49,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = isActChamp ? "#8fd331" : "#f4f0e6";
    ctx.font = "700 18px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+24) - (isActChamp?26:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+15, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#c7f08a");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#d8d2c4";
    ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.matches), cx.matches+matchesW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillStyle = "#8fd331";
    ctx.fillText(String(r.wins), cx.booyah+booyahW/2, midY);

    ctx.fillStyle = globalRank===0 ? "#8fd331" : pointColors[globalRank % pointColors.length];
    ctx.font = "800 22px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.totalPoints), cx.pts+ptsW/2, midY);
  }

  const footY = headerH+tableH+24;
  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#8fd331";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+32);
    const tagW = ctx.measureText(tagline).width;
    function footerArrow(cx0, dir){
      ctx.save();
      ctx.translate(cx0, footY+27);
      ctx.fillStyle = "#8fd331";
      ctx.beginPath();
      if(dir>0){ ctx.moveTo(0,-7); ctx.lineTo(14,0); ctx.lineTo(0,7); }
      else{ ctx.moveTo(0,-7); ctx.lineTo(-14,0); ctx.lineTo(0,7); }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    footerArrow(width/2-tagW/2-26, -1);
    footerArrow(width/2+tagW/2+26, 1);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8fd331";
    ctx.fillText(dateLabel, outerPad, footY+34);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#5f7f44";
    ctx.fillText(pageLabel, width-outerPad, footY+32);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 16 : 20;
    const gap = 12;
    const sLogoCy = footY + 32 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#5f7f44";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1509";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#8fd331";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Green Table" — two columns x 6 rows (12 teams/image)
   variant. Same theme as renderGreenTableDesign, just capped at 6 rows
   per column. ---- */
export function renderGreenTableTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderGreenTableDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Green Table" — single wide column, every team listed
   top-to-bottom in ranked order (up to 12 teams/image). Same lime "FI"
   corner-mark theme and column schema as the two-column Green Table
   design above. ---- */
export function renderGreenTableOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const LIME = "#8fd331";
  const LIME_DIM = "#3c7d16";

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 46;
  const headerH = 200;
  const colHeadH = 56;
  const rowH = 66;
  const footerH = 68 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 40;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#070a05";
  ctx.fillRect(0,0,width,height);
  const glow = ctx.createRadialGradient(width*0.5,0,0,width*0.5,0,width*0.6);
  glow.addColorStop(0,"rgba(140,230,60,0.10)");
  glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,width,height);

  function fiMark(cx0,cy0,flipX){
    ctx.save();
    ctx.translate(cx0,cy0);
    ctx.scale(flipX?-1:1,1);
    ctx.strokeStyle = LIME;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(10,54); ctx.lineTo(38,10); ctx.stroke();
    ctx.fillStyle = LIME;
    ctx.beginPath(); ctx.arc(46,10,6,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  fiMark(26,20,false);
  fiMark(width-26,20,true);

  ctx.textAlign = "center";

  ctx.save();
  ctx.shadowColor = "rgba(140,230,60,0.35)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#eef4e2";
  ctx.font = "800 50px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-260), width/2, 102);
  ctx.restore();

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
    const seasonW = ctx.measureText(seasonLabel).width + 34;
    roundRectPath(ctx, width/2-seasonW/2, 124, seasonW, 30, 15);
    ctx.strokeStyle = "rgba(140,230,60,0.6)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = LIME;
    ctx.fillText(seasonLabel, width/2, 144);
  }

  if(champRush){
    ctx.font = "800 17px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#c7f08a";
    drawIconTextLine(ctx, width/2, seasonLabel ? 178 : 152, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:20});
  }

  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);
  const rankW=70, matchesW=104, killsW=100, booyahW=112, ptsW=132;
  const teamW = colW - rankW - matchesW - killsW - booyahW - ptsW;
  const cx = {
    rank: x0,
    team: x0+rankW,
    matches: x0+rankW+teamW,
    kills: x0+rankW+teamW+matchesW,
    booyah: x0+rankW+teamW+matchesW+killsW,
    pts: x0+rankW+teamW+matchesW+killsW+booyahW
  };

  const headY = headerH;
  roundRectPath(ctx, x0, headY, colW, colHeadH, 8);
  ctx.fillStyle = "rgba(140,230,60,0.10)";
  ctx.fill();
  ctx.strokeStyle = "rgba(140,230,60,0.35)";
  ctx.lineWidth = 1;
  roundRectPath(ctx, x0, headY, colW, colHeadH, 8);
  ctx.stroke();
  const headMidY = headY+colHeadH/2+5;
  ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#eef4e2";
  ctx.textAlign = "center";
  ctx.fillText("#", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  drawIconTextLine(ctx, cx.matches+matchesW/2, headMidY, [{icon:"gamepad"},{text:"MATCHES"}], {iconSize:11});
  drawIconTextLine(ctx, cx.kills+killsW/2, headMidY, [{icon:"target"},{text:"KILLS"}], {iconSize:11});
  ctx.fillStyle = LIME;
  drawIconTextLine(ctx, cx.booyah+booyahW/2, headMidY, [{icon:"trophy"},{text:"BOOYAH!"}], {iconSize:11});
  ctx.fillStyle = "#eef4e2";
  ctx.fillText("POINTS", cx.pts+ptsW/2, headMidY);

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isChamp = isChampionTeam(r.totalPoints);
    const isActChamp = isActualChampion(r.team.id);
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
    ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.025)" : "rgba(140,230,60,0.03)";
    ctx.fill();
    ctx.strokeStyle = "rgba(140,230,60,0.15)";
    ctx.lineWidth = 1;
    roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
    ctx.stroke();
    if(isActChamp){
      ctx.fillStyle = "rgba(140,230,60,0.10)";
      roundRectPath(ctx, x0, rowY+4, colW, rowH-8, 8);
      ctx.fill();
    }else if(isChamp){
      ctx.save();
      ctx.shadowColor = "rgba(140,230,60,0.6)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "rgba(140,230,60,0.55)";
      ctx.lineWidth = 1.4;
      roundRectPath(ctx, x0+1, rowY+5, colW-2, rowH-10, 8);
      ctx.stroke();
      ctx.restore();
    }

    ctx.textAlign = "center";
    ctx.font = "800 22px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = globalRank<3 ? LIME : "#eef4e2";
    ctx.fillText(String(globalRank+1), x0+rankW/2, midY-3);

    const logoR = 21, logoCx = cx.team+27, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#0d1408";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = LIME;
      ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(140,230,60,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = isActChamp ? LIME : "#eef4e2";
    ctx.font = "700 18px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+24) - (isActChamp?26:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+15, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, LIME);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#c9d4bd";
    ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.matches), cx.matches+matchesW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillStyle = LIME;
    ctx.fillText(String(r.wins), cx.booyah+booyahW/2, midY);

    ctx.fillStyle = LIME;
    ctx.font = "800 22px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.totalPoints), cx.pts+ptsW/2, midY);
  }

  const footY = headerH+tableH+24;
  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = LIME;
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+32);
    const tagW = ctx.measureText(tagline).width;
    function footerArrow(cx0, dir){
      ctx.save();
      ctx.translate(cx0, footY+27);
      ctx.fillStyle = LIME;
      ctx.beginPath();
      if(dir>0){ ctx.moveTo(0,-7); ctx.lineTo(14,0); ctx.lineTo(0,7); }
      else{ ctx.moveTo(0,-7); ctx.lineTo(-14,0); ctx.lineTo(0,7); }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    footerArrow(width/2-tagW/2-26, -1);
    footerArrow(width/2+tagW/2+26, 1);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = LIME;
    ctx.fillText(dateLabel, outerPad, footY+34);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = LIME_DIM;
    ctx.fillText(pageLabel, width-outerPad, footY+32);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 16 : 20;
    const gap = 12;
    const sLogoCy = footY + 32 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = LIME_DIM;
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#0d1408";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = LIME;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
