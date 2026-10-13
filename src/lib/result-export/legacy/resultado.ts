// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isChampionTeam, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Resultado Brutalist" — matte black card topped by a
   torn-paper white banner with a huge black title, orange rank/total
   accents and thin hairline row dividers, echoing the reference
   "RESULTADO" brutalist leaderboard. Same column set (rank / team /
   played / kills / placement / booyah / total) as every other theme. ---- */
export function drawResultadoBanner(ctx, x0, y0, w, h, title){
  // torn-paper bottom edge, same silhouette as the reference design's
  // CSS clip-path, scaled to the banner's own width/height.
  const pts = [
    [1.00, 0.68],[0.88, 1.00],[0.72, 0.82],[0.56, 1.00],
    [0.40, 0.78],[0.24, 1.00],[0.10, 0.82],[0.00, 1.00]
  ];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0+w, y0);
  pts.forEach(([fx,fy])=> ctx.lineTo(x0+fx*w, y0+fy*h));
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#0a0a0a";
  ctx.font = "900 46px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, title, w-160), x0+w/2, y0+h*0.55);
  ctx.restore();
}

export function renderResultadoDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  rowsPerCol = rowsPerCol || 9; // default: 2 columns x 9 rows = 18 teams per table/image
  const leftRanks  = ranks.slice(0, rowsPerCol);
  const rightRanks = ranks.slice(rowsPerCol, rowsPerCol*2);
  const leftLogos  = logos.slice(0, rowsPerCol);
  const rightLogos = logos.slice(rowsPerCol, rowsPerCol*2);
  const numRows = Math.max(leftRanks.length, rightRanks.length, 1);

  const baseWidth = 1536;
  const outerPad = 44;
  const bannerH = 150;
  const headerH = 244;
  const colHeadH = 44;
  const rowH = 64;
  const midGap = 72;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: matte black ---- */
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0,0,width,height);

  /* ---- torn-paper white banner with huge black title ---- */
  drawResultadoBanner(ctx, 0, 0, width, bannerH, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase());

  /* ---- small tournament logo, left, sitting in the black area under the banner ---- */
  {
    const bigLogoR = 34, bigLogoCx = outerPad+bigLogoR, bigLogoCy = bannerH+40;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#151515";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,140,0,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  ctx.textAlign = "left";

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#999999";
    ctx.fillText(seasonLabel, outerPad+80, bannerH+30);
  }

  if(champRush){
    ctx.textAlign = "right";
    ctx.font = "800 15px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#FF8C00";
    drawIconTextLine(ctx, width-outerPad, bannerH+40, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:17});
  }

  /* ---- shared column geometry ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const rankW=58, playedW=60, killsW=60, placementW=76, booyahW=76, totalW=100;
  const teamW = colW - rankW - playedW - killsW - placementW - booyahW - totalW;

  function colXOf(x0){
    return {
      rank: x0,
      team: x0+rankW,
      played: x0+rankW+teamW,
      kills: x0+rankW+teamW+playedW,
      placement: x0+rankW+teamW+playedW+killsW,
      booyah: x0+rankW+teamW+playedW+killsW+placementW,
      total: x0+rankW+teamW+playedW+killsW+placementW+booyahW
    };
  }

  function drawColumnHeader(x0){
    const headY = headerH;
    const cx = colXOf(x0);
    const midY = headY+colHeadH/2+5;
    ctx.font = "700 11px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("RANK", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillText("PL", cx.played+playedW/2, midY);
    ctx.fillText("KILL", cx.kills+killsW/2, midY);
    ctx.fillText("PTS", cx.placement+placementW/2, midY);
    ctx.fillText("BOOYAH", cx.booyah+booyahW/2, midY);
    ctx.fillText("TOTAL", cx.total+totalW/2, midY);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, headY+colHeadH);
    ctx.lineTo(x0+colW, headY+colHeadH);
    ctx.stroke();
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

      // zebra background — thin hairline dividers, brutalist style
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.04)" : "transparent";
      ctx.fillRect(x0, rowY, colW, rowH);
      if(isActChamp){
        ctx.fillStyle = "rgba(255,140,0,0.12)";
        ctx.fillRect(x0, rowY, colW, rowH);
      }else if(isChamp){
        ctx.strokeStyle = "rgba(255,140,0,0.6)";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x0+1, rowY+2, colW-2, rowH-4);
      }

      // rank number — always orange, no per-place recolor (brutalist rule)
      ctx.textAlign = "center";
      ctx.font = "900 20px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#FF8C00";
      ctx.fillText(String(globalRank+1), cx.rank+rankW/2, midY);

      // team logo
      const logoR = 18, logoCx = cx.team+22, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#161616";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#FF8C00";
        ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.stroke();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? "#FF8C00" : "#ffffff";
      ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+18) - (isActChamp?24:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+12, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-13, midY-7, 14, "#FF8C00");
      }

      // stat columns — flat gray monospace, brutalist / scoreboard feel
      ctx.textAlign = "center";
      ctx.fillStyle = "#cccccc";
      ctx.font = "700 15px 'Courier New', monospace";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? "#2ECC71" : "#555555";
      ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

      ctx.fillStyle = "#FF8C00";
      ctx.font = "700 19px 'Courier New', monospace";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

      // row divider
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, rowY+rowH);
      ctx.lineTo(x0+colW, rowY+rowH);
      ctx.stroke();
    }
  }

  drawPlayerPhoto(ctx, photo, [[leftX, headerH, colW, tableH],[rightX, headerH, colW, tableH]]);
  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  /* ---- footer: brutalist centered credit line + date/page label ---- */
  const footY = headerH+tableH+22;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  ctx.textAlign = "center";
  ctx.fillStyle = "#555555";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillText(tagline || "FREE FIRE ESPORTS", width/2, footY+34);

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#888888";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(pageLabel, width-outerPad, footY+36);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 34 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalWs = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#151515";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,140,0,0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Resultado Brutalist" — "Two Columns (6+6)" layout, capped
   at 6 rows per column (12 teams per image). ---- */
export function renderResultadoTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderResultadoDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Resultado Brutalist" — "One Column (12 Teams)" layout,
   single wide column instead of the two-column split above. ---- */
export function renderResultadoOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const bannerH = 140;
  const headerH = 226;
  const colHeadH = 44;
  const rowH = 66;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0,0,width,height);

  drawResultadoBanner(ctx, 0, 0, width, bannerH, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase());

  {
    const bigLogoR = 30, bigLogoCx = outerPad+bigLogoR, bigLogoCy = bannerH+36;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#151515";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,140,0,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  ctx.textAlign = "left";

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#999999";
    ctx.fillText(seasonLabel, outerPad+72, bannerH+28);
  }

  if(champRush){
    ctx.textAlign = "right";
    ctx.font = "800 15px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#FF8C00";
    drawIconTextLine(ctx, width-outerPad, bannerH+36, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:17});
  }

  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  const rankW=62, playedW=88, killsW=88, placementW=104, booyahW=100, totalW=130;
  const teamW = colW - rankW - playedW - killsW - placementW - booyahW - totalW;

  const cx = {
    rank: x0,
    team: x0+rankW,
    played: x0+rankW+teamW,
    kills: x0+rankW+teamW+playedW,
    placement: x0+rankW+teamW+playedW+killsW,
    booyah: x0+rankW+teamW+playedW+killsW+placementW,
    total: x0+rankW+teamW+playedW+killsW+placementW+booyahW
  };

  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);
  const headY = headerH;
  const headMidY = headY+colHeadH/2+5;
  ctx.font = "700 11px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("RANK", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillText("PLAYED", cx.played+playedW/2, headMidY);
  ctx.fillText("KILL", cx.kills+killsW/2, headMidY);
  ctx.fillText("PLACE PTS", cx.placement+placementW/2, headMidY);
  ctx.fillText("BOOYAH", cx.booyah+booyahW/2, headMidY);
  ctx.fillText("TOTAL", cx.total+totalW/2, headMidY);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, headY+colHeadH);
  ctx.lineTo(x0+colW, headY+colHeadH);
  ctx.stroke();

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isChamp = isChampionTeam(r.totalPoints);
    const isActChamp = isActualChampion(r.team.id);
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.04)" : "transparent";
    ctx.fillRect(x0, rowY, colW, rowH);
    if(isActChamp){
      ctx.fillStyle = "rgba(255,140,0,0.12)";
      ctx.fillRect(x0, rowY, colW, rowH);
    }else if(isChamp){
      ctx.strokeStyle = "rgba(255,140,0,0.6)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x0+1, rowY+2, colW-2, rowH-4);
    }

    ctx.textAlign = "center";
    ctx.font = "900 21px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#FF8C00";
    ctx.fillText(String(globalRank+1), cx.rank+rankW/2, midY);

    const logoR = 19, logoCx = cx.team+24, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#161616";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#FF8C00";
      ctx.font = "800 15px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = isActChamp ? "#FF8C00" : "#ffffff";
    ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+20) - (isActChamp?24:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+13, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-13, midY-7, 14, "#FF8C00");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#cccccc";
    ctx.font = "700 15px 'Courier New', monospace";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = r.wins ? "#2ECC71" : "#555555";
    ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

    ctx.fillStyle = "#FF8C00";
    ctx.font = "700 20px 'Courier New', monospace";
    ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, rowY+rowH);
    ctx.lineTo(x0+colW, rowY+rowH);
    ctx.stroke();
  }

  const footY = headerH+tableH+22;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  ctx.textAlign = "center";
  ctx.fillStyle = "#555555";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillText(tagline || "FREE FIRE ESPORTS", width/2, footY+34);

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#888888";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(pageLabel, width-outerPad, footY+36);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 34 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW2 = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#151515";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,140,0,0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
