// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "White Card Clean" — a bright white card with an orange
   progress bar under each team showing their share of the top score, and
   a compact inline stat line (KLS / PLC / M / BOOYAH), echoing the
   reference minimal "RANKING" list. Same column set (rank / team /
   played / kills / placement / booyah / total) as every other theme. ---- */
export function renderWhiteCardDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  rowsPerCol = rowsPerCol || 9; // default: 2 columns x 9 rows = 18 teams per table/image
  const leftRanks  = ranks.slice(0, rowsPerCol);
  const rightRanks = ranks.slice(rowsPerCol, rowsPerCol*2);
  const leftLogos  = logos.slice(0, rowsPerCol);
  const rightLogos = logos.slice(rowsPerCol, rowsPerCol*2);
  const numRows = Math.max(leftRanks.length, rightRanks.length, 1);
  const maxTotal = Math.max(1, ...leftRanks.concat(rightRanks).map(r=>r.totalPoints));

  const baseWidth = 1536;
  const outerPad = 48;
  const headerH = 156;
  const rowH = 96;
  const midGap = 72;
  const footerH = 66 + (sponsorLogos.length ? 56 : 0);
  const tableH = rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {left:22, overlap:0});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 30;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: white card with a soft drop shadow ---- */
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 8;
  roundRectPath(ctx, outerPad*0.4, outerPad*0.4, width-outerPad*0.8, height-outerPad*0.8, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  /* ---- header ---- */
  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "900 46px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-outerPad*2-260), outerPad, 74);

  const totalTeams = leftRanks.length+rightRanks.length;
  const subtitle = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(subtitle){
    ctx.fillStyle = "#999999";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(subtitle, outerPad, 104);
  }

  {
    const bigLogoR = 30, bigLogoCx = width-outerPad-30, bigLogoCy = 100;
    if(tourneyLogo){
      ctx.save();
      ctx.beginPath();
      ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#f5f5f5";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
      ctx.restore();
    }
  }

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel || champRush){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#bbbbbb";
    if(seasonLabel) ctx.fillText(seasonLabel, width-outerPad-64, 104);
    if(champRush){
      ctx.fillStyle = "#FF8C00";
      drawIconTextLine(ctx, width-outerPad-64, 124, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:14, align:"right"});
    }
  }

  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, headerH-16);
  ctx.lineTo(width-outerPad, headerH-16);
  ctx.stroke();

  /* ---- shared column geometry ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
  drawPlayerPhoto(ctx, photo, [[leftX, headerH, colW, tableH],[rightX, headerH, colW, tableH]]);

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isTop3 = globalRank < 3;
      const isActChamp = isActualChampion(r.team.id);
      const rowY = headerH + i*rowH;
      const rankColor = globalRank===0 ? "#FF8C00" : globalRank===1 ? "#888888" : globalRank===2 ? "#CD7F32" : "#dddddd";
      const barColor = globalRank===0 ? "#FF8C00" : isTop3 ? "#FFB84D" : "#dddddd";

      // rank number
      ctx.textAlign = "right";
      ctx.font = "900 24px 'Courier New', monospace";
      ctx.fillStyle = rankColor;
      ctx.fillText(String(globalRank+1), x0+32, rowY+30);

      // team logo
      const logoR = 15, logoCx = x0+72, logoCy = rowY+20;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#f5f5f5";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#FF8C00";
        ctx.font = "800 12px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+4);
      }
      ctx.restore();

      const textX = logoCx+logoR+14;
      const rightEdge = x0+colW;

      // team name + total, same line
      ctx.textAlign = "left";
      ctx.fillStyle = "#111111";
      ctx.font = "700 18px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(fitCanvasText(ctx, r.team.name, rightEdge-textX-90), textX, rowY+26);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", rightEdge-96, rowY+20, 15, "#FF8C00");
      }
      ctx.textAlign = "right";
      ctx.fillStyle = "#FF8C00";
      ctx.font = "900 21px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), rightEdge, rowY+27);

      // progress bar
      const barY = rowY+38, barH = 6, barW = rightEdge-textX;
      roundRectPath(ctx, textX, barY, barW, barH, 3);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
      const fillW = Math.max(4, barW * (r.totalPoints/maxTotal));
      roundRectPath(ctx, textX, barY, fillW, barH, 3);
      ctx.fillStyle = barColor;
      ctx.fill();

      // inline stat line
      ctx.textAlign = "left";
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "600 12px Inter, 'Segoe UI', sans-serif";
      let sx = textX;
      const statY = barY+22;
      function stat(label,val){
        ctx.fillText(label+" "+val, sx, statY);
        sx += ctx.measureText(label+" "+val).width + 18;
      }
      stat("M", r.matches);
      stat("KLS", r.totalKills);
      stat("PLC", r.placementPts);
      if(r.wins){
        ctx.fillStyle = "#2ECC71";
        ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
        drawCanvasIcon(ctx, "trophy", sx+7, statY-4, 13, "#2ECC71");
        ctx.fillText("BOOYAH x"+r.wins, sx+18, statY);
      }

      // row divider
      ctx.strokeStyle = "#f5f5f5";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, rowY+rowH-4);
      ctx.lineTo(x0+colW, rowY+rowH-4);
      ctx.stroke();
    }
  }

  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  /* ---- footer ---- */
  const footY = headerH+tableH+22;
  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "700 15px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#bbbbbb";
    ctx.fillText(dateLabel, outerPad, footY+20);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(pageLabel, width-outerPad, footY+20);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 20 + 30;
    let sLogoCx = width - outerPad - sLogoR;
    const totalWs = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#f5f5f5";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "White Card Clean" — "Two Columns (6+6)" layout, capped at
   6 rows per column (12 teams per image). ---- */
export function renderWhiteCardTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderWhiteCardDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "White Card Clean" — "One Column (12 Teams)" layout,
   single wide column instead of the two-column split above. ---- */
export function renderWhiteCardOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);
  const maxTotal = Math.max(1, ...pageRanks.map(r=>r.totalPoints));

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const headerH = 150;
  const rowH = 92;
  const footerH = 66 + (sponsorLogos.length ? 56 : 0);
  const tableH = rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {left:22, overlap:0});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 30;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 8;
  roundRectPath(ctx, outerPad*0.4, outerPad*0.4, width-outerPad*0.8, height-outerPad*0.8, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "900 40px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-outerPad*2-220), outerPad, 66);

  const subtitle = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(subtitle){
    ctx.fillStyle = "#999999";
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(subtitle, outerPad, 96);
  }

  {
    const bigLogoR = 26, bigLogoCx = width-outerPad-26, bigLogoCy = 92;
    if(tourneyLogo){
      ctx.save();
      ctx.beginPath();
      ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#f5f5f5";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
      ctx.restore();
    }
  }

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel || champRush){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#bbbbbb";
    if(seasonLabel) ctx.fillText(seasonLabel, width-outerPad-56, 96);
    if(champRush){
      ctx.fillStyle = "#FF8C00";
      drawIconTextLine(ctx, width-outerPad-56, 116, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:13, align:"right"});
    }
  }

  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, headerH-16);
  ctx.lineTo(width-outerPad, headerH-16);
  ctx.stroke();

  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isTop3 = globalRank < 3;
    const isActChamp = isActualChampion(r.team.id);
    const rowY = headerH + i*rowH;
    const rankColor = globalRank===0 ? "#FF8C00" : globalRank===1 ? "#888888" : globalRank===2 ? "#CD7F32" : "#dddddd";
    const barColor = globalRank===0 ? "#FF8C00" : isTop3 ? "#FFB84D" : "#dddddd";

    ctx.textAlign = "right";
    ctx.font = "900 26px 'Courier New', monospace";
    ctx.fillStyle = rankColor;
    ctx.fillText(String(globalRank+1), x0+36, rowY+30);

    const logoR = 17, logoCx = x0+80, logoCy = rowY+20;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#f5f5f5";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#FF8C00";
      ctx.font = "800 13px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+4);
    }
    ctx.restore();

    const textX = logoCx+logoR+16;
    const rightEdge = x0+colW;

    ctx.textAlign = "left";
    ctx.fillStyle = "#111111";
    ctx.font = "700 19px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(fitCanvasText(ctx, r.team.name, rightEdge-textX-100), textX, rowY+27);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", rightEdge-104, rowY+20, 16, "#FF8C00");
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "#FF8C00";
    ctx.font = "900 23px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.totalPoints), rightEdge, rowY+28);

    const barY = rowY+40, barH = 7, barW = rightEdge-textX;
    roundRectPath(ctx, textX, barY, barW, barH, 3);
    ctx.fillStyle = "#f0f0f0";
    ctx.fill();
    const fillW = Math.max(4, barW * (r.totalPoints/maxTotal));
    roundRectPath(ctx, textX, barY, fillW, barH, 3);
    ctx.fillStyle = barColor;
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "600 13px Inter, 'Segoe UI', sans-serif";
    let sx = textX;
    const statY = barY+24;
    function stat(label,val){
      ctx.fillText(label+" "+val, sx, statY);
      sx += ctx.measureText(label+" "+val).width + 20;
    }
    stat("M", r.matches);
    stat("KLS", r.totalKills);
    stat("PLC", r.placementPts);
    if(r.wins){
      ctx.fillStyle = "#2ECC71";
      ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
      drawCanvasIcon(ctx, "trophy", sx+7, statY-4, 14, "#2ECC71");
      ctx.fillText("BOOYAH x"+r.wins, sx+19, statY);
    }

    ctx.strokeStyle = "#f5f5f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, rowY+rowH-4);
    ctx.lineTo(x0+colW, rowY+rowH-4);
    ctx.stroke();
  }

  const footY = headerH+tableH+22;
  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#bbbbbb";
    ctx.fillText(dateLabel, outerPad, footY+20);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(pageLabel, width-outerPad, footY+20);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 20 + 30;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW2 = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#f5f5f5";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
