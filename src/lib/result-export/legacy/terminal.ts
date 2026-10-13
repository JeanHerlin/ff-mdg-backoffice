// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawPlayerPhoto, planPlayerPhoto, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Terminal / CLI" — a macOS-style terminal window with
   traffic-light dots, a fake `$ ./results` command line and a green-on-
   black monospace table, echoing the reference CLI leaderboard. Same
   column set (rank / team / played / kills / placement / booyah / total)
   as every other theme. ---- */
export function renderTerminalDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
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
  const titleBarH = 46;
  const cmdBlockH = 84;
  const colHeadH = 34;
  const rowH = 40;
  const midGap = 40;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, titleBarH+cmdBlockH, tableH, titleBarH+cmdBlockH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = titleBarH + cmdBlockH + tableH + footerH + 40;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: near-black terminal window ---- */
  roundRectPath(ctx, 0,0,width,height, 12);
  ctx.fillStyle = "#0C0C0C";
  ctx.fill();

  /* ---- title bar: traffic-light dots + filename ---- */
  ctx.save();
  roundRectPath(ctx, 0,0,width,titleBarH, 12);
  ctx.clip();
  ctx.fillStyle = "#1C1C1C";
  ctx.fillRect(0,0,width,titleBarH);
  ctx.restore();
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0,titleBarH);
  ctx.lineTo(width,titleBarH);
  ctx.stroke();

  const dotColors = ["#FF5F57","#FFBD2E","#28C840"];
  dotColors.forEach((c,i)=>{
    ctx.beginPath();
    ctx.arc(outerPad+8+i*22, titleBarH/2, 7, 0, Math.PI*2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  ctx.textAlign = "left";

  /* ---- command line: shows the season, if the user set one ---- */
  const cmdY = titleBarH+28;
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.fillStyle = "#28C840";
    ctx.font = "600 15px 'Courier New', monospace";
    ctx.fillText(seasonLabel, outerPad, cmdY);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#555555";
  ctx.font = "700 30px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), 560), width-outerPad, cmdY);
  if(champRush){
    ctx.font = "700 13px 'Courier New', monospace";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("[ CHAMPION RUSH ]", width-outerPad, titleBarH+62);
  }

  {
    const bigLogoR = 22, bigLogoCx = width-outerPad-bigLogoR-6, bigLogoCy = titleBarH/2;
    if(tourneyLogo){
      ctx.save();
      ctx.beginPath();
      ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
      ctx.restore();
    }
  }

  /* ---- shared column geometry ---- */
  const tableY = titleBarH+cmdBlockH;
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
  drawPlayerPhoto(ctx, photo, [[leftX, tableY, colW, tableH],[rightX, tableY, colW, tableH]]);
  const rankW=58, playedW=56, killsW=52, placementW=64, booyahW=68, totalW=90;
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

  function drawTableBox(x0){
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, tableY, colW, colHeadH+rowH*numRows);
    ctx.beginPath();
    ctx.moveTo(x0, tableY+colHeadH);
    ctx.lineTo(x0+colW, tableY+colHeadH);
    ctx.stroke();
    const cx = colXOf(x0);
    [cx.team, cx.played, cx.kills, cx.placement, cx.booyah, cx.total].forEach(vx=>{
      ctx.beginPath();
      ctx.moveTo(vx, tableY);
      ctx.lineTo(vx, tableY+colHeadH+rowH*numRows);
      ctx.stroke();
    });
  }

  function drawColumnHeader(x0){
    const cx = colXOf(x0);
    const midY = tableY+colHeadH/2+5;
    ctx.font = "700 13px 'Courier New', monospace";
    ctx.fillStyle = "#28C840";
    ctx.textAlign = "center";
    ctx.fillText("##", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillText("MATCH", cx.played+playedW/2, midY);
    ctx.fillText("KILL", cx.kills+killsW/2, midY);
    ctx.fillText("PLACE", cx.placement+placementW/2, midY);
    ctx.fillText("WINS", cx.booyah+booyahW/2, midY);
    ctx.fillText("TOTAL", cx.total+totalW/2, midY);
  }

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    const cx = colXOf(x0);
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isActChamp = isActualChampion(r.team.id);
      const rankColor = globalRank===0 ? "#FFD700" : globalRank===1 ? "#C0C0C0" : globalRank===2 ? "#CD7F32" : "#28C840";
      const totalColor = globalRank<3 ? "#FF8C00" : "#28C840";
      const rowY = tableY + colHeadH + i*rowH;
      const midY = rowY + rowH/2 + 5;

      if(isActChamp){
        ctx.fillStyle = "rgba(255,215,0,0.08)";
        ctx.fillRect(x0+1, rowY+1, colW-2, rowH-2);
      }

      ctx.textAlign = "center";
      ctx.font = "700 14px 'Courier New', monospace";
      ctx.fillStyle = rankColor;
      ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

      // tiny logo swatch
      const logoR = 10, logoCx = cx.team+14, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }
      ctx.restore();

      ctx.textAlign = "left";
      ctx.fillStyle = "#e0e0e0";
      ctx.font = "700 14px 'Courier New', monospace";
      const nameMaxW = teamW - (logoR*2+16);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+8, midY);

      ctx.textAlign = "center";
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "600 13px 'Courier New', monospace";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? "#28C840" : "#444444";
      ctx.fillText(r.wins ? String(r.wins) : "-", cx.booyah+booyahW/2, midY);

      ctx.textAlign = "right";
      ctx.fillStyle = totalColor;
      ctx.font = "700 14px 'Courier New', monospace";
      ctx.fillText(String(r.totalPoints), cx.total+totalW-10, midY);
    }
  }

  drawTableBox(leftX);
  drawTableBox(rightX);
  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  /* ---- footer ---- */
  const footY = tableY+colHeadH+rowH*numRows+30;
  const totalTeams = leftRanks.length+rightRanks.length;
  ctx.textAlign = "left";
  ctx.fillStyle = "#555555";
  ctx.font = "600 14px 'Courier New', monospace";
  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  ctx.fillText(totalTeams+" rows"+(dateLabel ? " · generated "+dateLabel : "")+(pageLabel ? " · "+pageLabel : ""), outerPad, footY);

  ctx.fillStyle = "#28C840";
  ctx.font = "700 15px 'Courier New', monospace";
  ctx.fillText("$ _", outerPad, footY+30);

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "right";
    ctx.fillStyle = "#444444";
    ctx.font = "600 12px 'Courier New', monospace";
    ctx.fillText(tagline, width-outerPad, footY);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 16 : 20;
    const gap = 12;
    const sLogoCy = footY + 30 + 32;
    let sLogoCx = width - outerPad - sLogoR;
    const totalWs = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "600 10px 'Courier New', monospace";
    ctx.fillStyle = "#555555";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Terminal / CLI" — "Two Columns (6+6)" layout, capped at
   6 rows per column (12 teams per image). ---- */
export function renderTerminalTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderTerminalDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Terminal / CLI" — "One Column (12 Teams)" layout, single
   wide table instead of the two-column split above. ---- */
export function renderTerminalOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const titleBarH = 46;
  const cmdBlockH = 84;
  const colHeadH = 36;
  const rowH = 42;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, titleBarH+cmdBlockH, tableH, titleBarH+cmdBlockH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = titleBarH + cmdBlockH + tableH + footerH + 40;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  roundRectPath(ctx, 0,0,width,height, 12);
  ctx.fillStyle = "#0C0C0C";
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, 0,0,width,titleBarH, 12);
  ctx.clip();
  ctx.fillStyle = "#1C1C1C";
  ctx.fillRect(0,0,width,titleBarH);
  ctx.restore();
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0,titleBarH);
  ctx.lineTo(width,titleBarH);
  ctx.stroke();

  const dotColors = ["#FF5F57","#FFBD2E","#28C840"];
  dotColors.forEach((c,i)=>{
    ctx.beginPath();
    ctx.arc(outerPad+8+i*22, titleBarH/2, 7, 0, Math.PI*2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  ctx.textAlign = "left";

  const cmdY = titleBarH+28;
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.fillStyle = "#28C840";
    ctx.font = "600 14px 'Courier New', monospace";
    ctx.fillText(seasonLabel, outerPad, cmdY);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#555555";
  ctx.font = "700 26px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), 380), width-outerPad, cmdY);
  if(champRush){
    ctx.font = "700 12px 'Courier New', monospace";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("[ CHAMPION RUSH ]", width-outerPad, titleBarH+58);
  }

  const tableY = titleBarH+cmdBlockH;
  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, tableY, colW, tableH]]);
  const rankW=66, playedW=90, killsW=80, placementW=100, booyahW=96, totalW=120;
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

  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, tableY, colW, colHeadH+rowH*numRows);
  ctx.beginPath();
  ctx.moveTo(x0, tableY+colHeadH);
  ctx.lineTo(x0+colW, tableY+colHeadH);
  ctx.stroke();
  [cx.team, cx.played, cx.kills, cx.placement, cx.booyah, cx.total].forEach(vx=>{
    ctx.beginPath();
    ctx.moveTo(vx, tableY);
    ctx.lineTo(vx, tableY+colHeadH+rowH*numRows);
    ctx.stroke();
  });

  const headMidY = tableY+colHeadH/2+5;
  ctx.font = "700 13px 'Courier New', monospace";
  ctx.fillStyle = "#28C840";
  ctx.textAlign = "center";
  ctx.fillText("##", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillText("MATCH", cx.played+playedW/2, headMidY);
  ctx.fillText("KILLS", cx.kills+killsW/2, headMidY);
  ctx.fillText("PLACE", cx.placement+placementW/2, headMidY);
  ctx.fillText("WINS", cx.booyah+booyahW/2, headMidY);
  ctx.fillText("TOTAL", cx.total+totalW/2, headMidY);

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isActChamp = isActualChampion(r.team.id);
    const rankColor = globalRank===0 ? "#FFD700" : globalRank===1 ? "#C0C0C0" : globalRank===2 ? "#CD7F32" : "#28C840";
    const totalColor = globalRank<3 ? "#FF8C00" : "#28C840";
    const rowY = tableY + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 5;

    if(isActChamp){
      ctx.fillStyle = "rgba(255,215,0,0.08)";
      ctx.fillRect(x0+1, rowY+1, colW-2, rowH-2);
    }

    ctx.textAlign = "center";
    ctx.font = "700 15px 'Courier New', monospace";
    ctx.fillStyle = rankColor;
    ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

    const logoR = 12, logoCx = cx.team+16, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1a1a1a";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = "#e0e0e0";
    ctx.font = "700 15px 'Courier New', monospace";
    const nameMaxW = teamW - (logoR*2+18);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+9, midY);

    ctx.textAlign = "center";
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "600 14px 'Courier New', monospace";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = r.wins ? "#28C840" : "#444444";
    ctx.fillText(r.wins ? String(r.wins) : "-", cx.booyah+booyahW/2, midY);

    ctx.textAlign = "right";
    ctx.fillStyle = totalColor;
    ctx.font = "700 15px 'Courier New', monospace";
    ctx.fillText(String(r.totalPoints), cx.total+totalW-12, midY);
  }

  const footY = tableY+colHeadH+rowH*numRows+30;
  ctx.textAlign = "left";
  ctx.fillStyle = "#555555";
  ctx.font = "600 14px 'Courier New', monospace";
  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  ctx.fillText(pageRanks.length+" rows"+(dateLabel ? " · generated "+dateLabel : "")+(pageLabel ? " · "+pageLabel : ""), outerPad, footY);

  ctx.fillStyle = "#28C840";
  ctx.font = "700 15px 'Courier New', monospace";
  ctx.fillText("$ _", outerPad, footY+30);

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "right";
    ctx.fillStyle = "#444444";
    ctx.font = "600 12px 'Courier New', monospace";
    ctx.fillText(tagline, width-outerPad, footY);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 16 : 20;
    const gap = 12;
    const sLogoCy = footY + 30 + 32;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW2 = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "600 10px 'Courier New', monospace";
    ctx.fillStyle = "#555555";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
