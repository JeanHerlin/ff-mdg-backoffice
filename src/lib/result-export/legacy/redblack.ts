// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, playerPhotoOverRect, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Red/Black Aggressive" — near-black "battle table" card
   with a red vertical accent bar, a solid red header band, and a
   crimson-tinted top row, echoing the reference aggressive tournament
   sheet. Same column set (rank / team / played / kills / placement /
   booyah / total) as every other theme. ---- */
export function renderRedBlackDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
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
  const headerH = 200;
  const colHeadH = 46;
  const rowH = 64;
  const midGap = 72;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: near-black with a dark red border frame ---- */
  ctx.fillStyle = "#0E0000";
  ctx.fillRect(0,0,width,height);
  ctx.strokeStyle = "#3a0000";
  ctx.lineWidth = 2;
  ctx.strokeRect(1,1,width-2,height-2);

  /* ---- red vertical accent bar + title block ---- */
  ctx.fillStyle = "#DC2626";
  ctx.fillRect(outerPad, 28, 6, 96);

  const titleX = outerPad + 26;
  ctx.textAlign = "left";

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 54px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-titleX-260), titleX, 84);

  /* ---- tournament logo, top-right ---- */
  {
    const bigLogoR = 50, bigLogoCx = width-outerPad-bigLogoR, bigLogoCy = 76;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1a0000";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#661111";
    ctx.fillText(seasonLabel, titleX, 132);
  }

  if(champRush){
    ctx.font = "800 15px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#DC2626";
    drawIconTextLine(ctx, titleX, seasonLabel ? 160 : 134, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:17, align:"left"});
  }

  /* ---- shared column geometry ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
  drawPlayerPhoto(ctx, photo, [[leftX, headerH, colW, tableH],[rightX, headerH, colW, tableH]]);
  const rankW=64, playedW=64, killsW=64, placementW=82, booyahW=80, totalW=108;
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
    roundRectPath(ctx, x0, headY, colW, colHeadH, 4);
    ctx.fillStyle = "#DC2626";
    ctx.fill();
    playerPhotoOverRect(ctx, photo, x0, headY, colW, colHeadH, 4);

    const cx = colXOf(x0);
    const midY = headY+colHeadH/2+5;
    ctx.font = "900 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("RANK", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillText("MATCHES", cx.played+playedW/2, midY);
    ctx.fillText("KILLS", cx.kills+killsW/2, midY);
    ctx.fillText("PLACE", cx.placement+placementW/2, midY);
    ctx.fillText("BOOYAH", cx.booyah+booyahW/2, midY);
    ctx.fillText("TOTAL", cx.total+totalW/2, midY);
  }

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    const cx = colXOf(x0);
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isTop3 = globalRank < 3;
      const isActChamp = isActualChampion(r.team.id);
      const rowY = headerH + colHeadH + i*rowH;
      const midY = rowY + rowH/2 + 6;

      if(globalRank===0){
        ctx.fillStyle = "rgba(220,38,38,0.12)";
        ctx.fillRect(x0, rowY, colW, rowH);
      }
      if(isActChamp){
        ctx.strokeStyle = "#DC2626";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x0+1, rowY+2, colW-2, rowH-4);
      }

      // rank number, zero-padded monospace
      ctx.textAlign = "center";
      ctx.font = "900 19px 'Courier New', monospace";
      ctx.fillStyle = isTop3 ? "#DC2626" : "#441111";
      ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

      // square team logo
      const logoS = 30, logoX = cx.team, logoY = rowY+rowH/2-logoS/2;
      ctx.save();
      roundRectPath(ctx, logoX, logoY, logoS, logoS, 4);
      ctx.fillStyle = "#1a0000";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoX, logoY, logoS, logoS);
      }else{
        ctx.fillStyle = "#DC2626";
        ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoX+logoS/2, logoY+logoS/2+5);
      }
      ctx.restore();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? "#DC2626" : "#ffffff";
      ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoS+22) - (isActChamp?26:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoX+logoS+14, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#DC2626");
      }

      // stat columns
      ctx.textAlign = "center";
      ctx.fillStyle = "#661111";
      ctx.font = "700 15px 'Courier New', monospace";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillStyle = "#aa3333";
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? "#2ECC71" : "#441111";
      ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

      ctx.fillStyle = isTop3 ? "#DC2626" : "#ff6666";
      ctx.font = "900 20px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

      // row divider
      ctx.strokeStyle = "#1a0000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, rowY+rowH);
      ctx.lineTo(x0+colW, rowY+rowH);
      ctx.stroke();
    }
  }

  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  // center divider
  ctx.strokeStyle = "#3a0000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midX, headerH);
  ctx.lineTo(midX, headerH+tableH);
  ctx.stroke();

  /* ---- footer ---- */
  const footY = headerH+tableH+22;
  ctx.strokeStyle = "#3a0000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#661111";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+34);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#661111";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  ctx.textAlign = "right";
  if(pageLabel){
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#441111";
    ctx.fillText(pageLabel, width-outerPad, footY+56);
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
    ctx.fillStyle = "#441111";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a0000";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Red/Black Aggressive" — "Two Columns (6+6)" layout,
   capped at 6 rows per column (12 teams per image). ---- */
export function renderRedBlackTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderRedBlackDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Red/Black Aggressive" — "One Column (12 Teams)" layout,
   single wide column instead of the two-column split above. ---- */
export function renderRedBlackOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = 12;
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const headerH = 190;
  const colHeadH = 44;
  const rowH = 66 + PORTRAIT.rowDelta;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0E0000";
  ctx.fillRect(0,0,width,height);
  ctx.strokeStyle = "#3a0000";
  ctx.lineWidth = 2;
  ctx.strokeRect(1,1,width-2,height-2);

  ctx.fillStyle = "#DC2626";
  ctx.fillRect(outerPad, 26, 6, 86);

  const titleX = outerPad + 24;
  ctx.textAlign = "left";

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 46px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-titleX-220), titleX, 76);

  {
    const bigLogoR = 42, bigLogoCx = width-outerPad-bigLogoR, bigLogoCy = 70;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1a0000";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#661111";
    ctx.fillText(seasonLabel, titleX, 116);
  }

  if(champRush){
    ctx.font = "800 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#DC2626";
    drawIconTextLine(ctx, titleX, seasonLabel ? 142 : 118, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:16, align:"left"});
  }

  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);
  const rankW=70, playedW=92, killsW=92, placementW=110, booyahW=104, totalW=138;
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

  const headY = headerH;
  roundRectPath(ctx, x0, headY, colW, colHeadH, 4);
  ctx.fillStyle = "#DC2626";
  ctx.fill();
  playerPhotoOverRect(ctx, photo, x0, headY, colW, colHeadH, 4);

  const headMidY = headY+colHeadH/2+5;
  ctx.font = "900 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("RANK", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillText("MATCHES", cx.played+playedW/2, headMidY);
  ctx.fillText("KILLS", cx.kills+killsW/2, headMidY);
  ctx.fillText("PLACE", cx.placement+placementW/2, headMidY);
  ctx.fillText("BOOYAH", cx.booyah+booyahW/2, headMidY);
  ctx.fillText("TOTAL", cx.total+totalW/2, headMidY);

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isTop3 = globalRank < 3;
    const isActChamp = isActualChampion(r.team.id);
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    if(globalRank===0){
      ctx.fillStyle = "rgba(220,38,38,0.12)";
      ctx.fillRect(x0, rowY, colW, rowH);
    }
    if(isActChamp){
      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x0+1, rowY+2, colW-2, rowH-4);
    }

    ctx.textAlign = "center";
    ctx.font = "900 20px 'Courier New', monospace";
    ctx.fillStyle = isTop3 ? "#DC2626" : "#441111";
    ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

    const logoS = 32, logoX = cx.team, logoY = rowY+rowH/2-logoS/2;
    ctx.save();
    roundRectPath(ctx, logoX, logoY, logoS, logoS, 4);
    ctx.fillStyle = "#1a0000";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoX, logoY, logoS, logoS);
    }else{
      ctx.fillStyle = "#DC2626";
      ctx.font = "800 15px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoX+logoS/2, logoY+logoS/2+5);
    }
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = isActChamp ? "#DC2626" : "#ffffff";
    ctx.font = "700 18px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoS+24) - (isActChamp?26:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoX+logoS+15, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#DC2626");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#661111";
    ctx.font = "700 16px 'Courier New', monospace";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillStyle = "#aa3333";
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = r.wins ? "#2ECC71" : "#441111";
    ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

    ctx.fillStyle = isTop3 ? "#DC2626" : "#ff6666";
    ctx.font = "900 21px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

    ctx.strokeStyle = "#1a0000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, rowY+rowH);
    ctx.lineTo(x0+colW, rowY+rowH);
    ctx.stroke();
  }

  const footY = headerH+tableH+22;
  ctx.strokeStyle = "#3a0000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#661111";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+34);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#661111";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  ctx.textAlign = "right";
  if(pageLabel){
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#441111";
    ctx.fillText(pageLabel, width-outerPad, footY+56);
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
    ctx.fillStyle = "#441111";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a0000";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
