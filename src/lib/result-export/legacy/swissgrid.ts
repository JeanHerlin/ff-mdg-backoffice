// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Swiss Grid" — a cream, sharp-cornered card with thick
   black rules, small-caps gray column labels and a solid black pill for
   the #1 total, echoing the reference minimal editorial scoreboard. Same
   column set (rank / team / played / kills / placement / booyah / total)
   as every other theme. ---- */
export function renderSwissGridDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
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
  const headerH = 150;
  const colHeadH = 40;
  const rowH = 62;
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

  /* ---- background: flat cream, no rounding ---- */
  ctx.fillStyle = "#F4F1EC";
  ctx.fillRect(0,0,width,height);

  /* ---- tournament logo, top-left ---- */
  {
    const bigLogoR = 46, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 66;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#e7e3da";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  /* ---- tournament title, next to the logo ---- */
  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "800 40px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-(outerPad+46*2+24)-260), outerPad+46*2+24, 78);

  /* ---- right-aligned meta block ---- */
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  const dateLabelTop = resultDateLabel || EXPORT_TEXT.date || "";
  ctx.textAlign = "right";
  ctx.fillStyle = "#111111";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  let metaY = 40;
  if(seasonLabel){ ctx.fillText(seasonLabel, width-outerPad, metaY); metaY += 22; }
  if(dateLabelTop){ ctx.fillText(dateLabelTop, width-outerPad, metaY); metaY += 22; }
  if(champRush){
    metaY += 24;
    ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#111111";
    drawIconTextLine(ctx, width-outerPad, metaY, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:14});
  }

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 3;
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
  const rankW=58, playedW=64, killsW=64, placementW=82, booyahW=80, totalW=108;
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
    const cx = colXOf(x0);
    const midY = headerH+colHeadH/2+3;
    ctx.font = "700 11px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#999999";
    ctx.textAlign = "left";
    ctx.fillText("#", cx.rank, midY);
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillText("M", cx.played+playedW/2, midY);
    ctx.fillText("KILLS", cx.kills+killsW/2, midY);
    ctx.fillText("PLACE", cx.placement+placementW/2, midY);
    ctx.fillText("BOOYAH", cx.booyah+booyahW/2, midY);
    ctx.fillText("TOTAL", cx.total+totalW/2, midY);

    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, headerH+colHeadH);
    ctx.lineTo(x0+colW, headerH+colHeadH);
    ctx.stroke();
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

      // rank number
      ctx.textAlign = "left";
      ctx.font = "700 17px 'Courier New', monospace";
      ctx.fillStyle = isTop3 ? "#111111" : "#bbbbbb";
      ctx.fillText(String(globalRank+1), cx.rank, midY);

      // team logo
      const logoR = 16, logoCx = cx.team+20, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#e7e3da";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#111111";
        ctx.font = "800 13px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+4);
      }
      ctx.restore();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = "#111111";
      ctx.font = (isTop3 ? "900 " : "700 ") + "17px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+20) - (isActChamp?24:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+12, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-13, midY-7, 14, "#111111");
      }

      // stat columns
      ctx.textAlign = "center";
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "600 14px 'Courier New', monospace";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillStyle = "#555555";
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? "#2ECC71" : "#cccccc";
      ctx.font = "700 14px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

      // total: solid black pill for #1, plain text otherwise
      if(globalRank===0){
        const pillText = String(r.totalPoints);
        ctx.font = "900 16px Rajdhani, 'Segoe UI', sans-serif";
        const pillW = ctx.measureText(pillText).width + 20;
        roundRectPath(ctx, cx.total+totalW/2-pillW/2, midY-19, pillW, 26, 2);
        ctx.fillStyle = "#111111";
        ctx.fill();
        ctx.fillStyle = "#F4F1EC";
        ctx.fillText(pillText, cx.total+totalW/2, midY);
      }else{
        ctx.fillStyle = isTop3 ? "#111111" : "#555555";
        ctx.font = (isTop3 ? "700 " : "400 ") + "17px Rajdhani, 'Segoe UI', sans-serif";
        ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);
      }

      // row divider
      ctx.strokeStyle = "#dddddd";
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

  /* ---- footer ---- */
  const footY = headerH+tableH+22;
  ctx.textAlign = "left";
  ctx.fillStyle = "#aaaaaa";
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillText("M = MATCHES · KILLS = TOTAL ELIMINATIONS · BOOYAH = WINS", outerPad, footY+20);

  ctx.textAlign = "right";
  ctx.fillStyle = "#aaaaaa";
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillText(pageLabel ? pageLabel.toUpperCase() : "FREE FIRE ESPORTS", width-outerPad, footY+20);

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#999999";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+20);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 20 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalWs = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#999999";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#e7e3da";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Swiss Grid" — "Two Columns (6+6)" layout, capped at 6
   rows per column (12 teams per image). ---- */
export function renderSwissGridTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderSwissGridDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Swiss Grid" — "One Column (12 Teams)" layout, single
   wide column instead of the two-column split above. ---- */
export function renderSwissGridOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const headerH = 140;
  const colHeadH = 40;
  const rowH = 64;
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

  ctx.fillStyle = "#F4F1EC";
  ctx.fillRect(0,0,width,height);

  {
    const bigLogoR = 40, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 60;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#e7e3da";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "800 34px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-(outerPad+40*2+20)-200), outerPad+40*2+20, 70);

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  const dateLabelTop = resultDateLabel || EXPORT_TEXT.date || "";
  ctx.textAlign = "right";
  ctx.fillStyle = "#111111";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  let metaY = 36;
  if(seasonLabel){ ctx.fillText(seasonLabel, width-outerPad, metaY); metaY += 20; }
  if(dateLabelTop){ ctx.fillText(dateLabelTop, width-outerPad, metaY); metaY += 20; }
  if(champRush){
    metaY += 22;
    ctx.font = "800 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#111111";
    drawIconTextLine(ctx, width-outerPad, metaY, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:13});
  }

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(outerPad, headerH-14);
  ctx.lineTo(width-outerPad, headerH-14);
  ctx.stroke();

  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);
  const rankW=66, playedW=92, killsW=92, placementW=110, booyahW=104, totalW=138;
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

  const headMidY = headerH+colHeadH/2+3;
  ctx.font = "700 11px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#999999";
  ctx.textAlign = "left";
  ctx.fillText("#", cx.rank, headMidY);
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillText("MATCHES", cx.played+playedW/2, headMidY);
  ctx.fillText("KILLS", cx.kills+killsW/2, headMidY);
  ctx.fillText("PLACE PTS", cx.placement+placementW/2, headMidY);
  ctx.fillText("BOOYAH", cx.booyah+booyahW/2, headMidY);
  ctx.fillText("TOTAL", cx.total+totalW/2, headMidY);

  ctx.strokeStyle = "#aaaaaa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, headerH+colHeadH);
  ctx.lineTo(x0+colW, headerH+colHeadH);
  ctx.stroke();

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isTop3 = globalRank < 3;
    const isActChamp = isActualChampion(r.team.id);
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    ctx.textAlign = "left";
    ctx.font = "700 18px 'Courier New', monospace";
    ctx.fillStyle = isTop3 ? "#111111" : "#bbbbbb";
    ctx.fillText(String(globalRank+1), cx.rank, midY);

    const logoR = 18, logoCx = cx.team+22, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#e7e3da";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#111111";
      ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+4);
    }
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = "#111111";
    ctx.font = (isTop3 ? "900 " : "700 ") + "18px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+22) - (isActChamp?24:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+14, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-13, midY-7, 15, "#111111");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "600 15px 'Courier New', monospace";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillStyle = "#555555";
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = r.wins ? "#2ECC71" : "#cccccc";
    ctx.font = "700 15px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

    if(globalRank===0){
      const pillText = String(r.totalPoints);
      ctx.font = "900 17px Rajdhani, 'Segoe UI', sans-serif";
      const pillW = ctx.measureText(pillText).width + 22;
      roundRectPath(ctx, cx.total+totalW/2-pillW/2, midY-20, pillW, 28, 2);
      ctx.fillStyle = "#111111";
      ctx.fill();
      ctx.fillStyle = "#F4F1EC";
      ctx.fillText(pillText, cx.total+totalW/2, midY);
    }else{
      ctx.fillStyle = isTop3 ? "#111111" : "#555555";
      ctx.font = (isTop3 ? "700 " : "400 ") + "18px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);
    }

    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, rowY+rowH);
    ctx.lineTo(x0+colW, rowY+rowH);
    ctx.stroke();
  }

  const footY = headerH+tableH+22;
  ctx.textAlign = "left";
  ctx.fillStyle = "#aaaaaa";
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillText("M = MATCHES · KILLS = TOTAL ELIMINATIONS · BOOYAH = WINS", outerPad, footY+20);

  ctx.textAlign = "right";
  ctx.fillStyle = "#aaaaaa";
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillText(pageLabel ? pageLabel.toUpperCase() : "FREE FIRE ESPORTS", width-outerPad, footY+20);

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#999999";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+20);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 20 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW2 = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#999999";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#e7e3da";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
