// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isChampionTeam, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Rank Table" — official two-column FREE FIRE rank table.
   Every result-table download now uses this layout. It shows up to 18 teams
   per image (two columns of up to 9 rows each). All text — tournament name,
   season, team names, and every stat column — is pulled live from state, so
   the whole table is fully editable simply by editing that data. ---- */
export function renderRankTableDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
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
  const headerH = 210;
  const colHeadH = 56;
  const rowH = 64;
  const midGap = 72;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0); // extra room for the sponsor/partner logo row
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: near-black with purple corner glows ---- */
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0,0,width,height);

  function radialGlow(cx,cy,r,color){
    const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,color);
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height);
  }
  radialGlow(width*0.10, 30, 460, "rgba(150,70,235,0.30)");
  radialGlow(width*0.90, 30, 460, "rgba(150,70,235,0.30)");
  radialGlow(width*0.5, height, width*0.55, "rgba(90,30,140,0.12)");

  /* ---- purple corner accent shapes (top-left / top-right) ---- */
  function cornerAccent(flip){
    ctx.save();
    if(flip){ ctx.translate(width,0); ctx.scale(-1,1); }
    const grad = ctx.createLinearGradient(0,0,230,96);
    grad.addColorStop(0,"#73c879");
    grad.addColorStop(1,"#155a35");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(210,0);
    ctx.lineTo(78,96);
    ctx.lineTo(0,96);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  cornerAccent(false);
  cornerAccent(true);

  /* ---- big tournament logo, top-left ---- */
  {
    const bigLogoR = 64, bigLogoCx = 118, bigLogoCy = 100;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1c1230";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(176,106,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  /* ---- title block: big editable tournament name, season pill ---- */
  ctx.textAlign = "center";

  ctx.save();
  ctx.shadowColor = "rgba(176,106,255,0.65)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 54px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-320), width/2, 108);
  ctx.restore();

  // Subtitle badge — left blank (no pill drawn) unless the user set one,
  // so a table without a season/event name doesn't show placeholder text.
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
    const seasonW = ctx.measureText(seasonLabel).width + 34;
    roundRectPath(ctx, width/2-seasonW/2, 128, seasonW, 30, 15);
    ctx.strokeStyle = "rgba(176,106,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#a6e68a";
    ctx.fillText(seasonLabel, width/2, 148);
  }

  if(champRush){
    ctx.font = "800 17px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#c7f08a";
    drawIconTextLine(ctx, width/2, seasonLabel ? 182 : 156, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:20});
  }

  /* ---- shared column geometry ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
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
    roundRectPath(ctx, x0, headY, colW, colHeadH, 10);
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fill();
    ctx.strokeStyle = "rgba(176,106,255,0.25)";
    ctx.lineWidth = 1;
    roundRectPath(ctx, x0, headY, colW, colHeadH, 10);
    ctx.stroke();

    const cx = colXOf(x0);
    const midY = headY+colHeadH/2+5;
    ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#a6df8a";
    ctx.textAlign = "center";
    ctx.fillText("#", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillStyle = "#e8e2ff";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillStyle = "#a6df8a";
    drawIconTextLine(ctx, cx.played+playedW/2, midY, [{icon:"flag"},{text:"PLAYED"}], {iconSize:11});
    drawIconTextLine(ctx, cx.kills+killsW/2, midY, [{icon:"target"},{text:"KILLS"}], {iconSize:11});
    ctx.fillStyle = "#e8e2ff";
    ctx.font = "800 11px Inter, 'Segoe UI', sans-serif";
    ctx.fillText("PLACE PTS", cx.placement+placementW/2, midY);
    ctx.fillStyle = "#c7f08a";
    ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
    drawIconTextLine(ctx, cx.booyah+booyahW/2, midY, [{icon:"trophy"},{text:"BOOYAH!"}], {iconSize:11});
    ctx.fillStyle = "#a6e68a";
    ctx.fillText("TOTAL PTS", cx.total+totalW/2, midY);
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

      // zebra background
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.018)" : "rgba(255,255,255,0.045)";
      ctx.fillRect(x0, rowY, colW, rowH);
      if(isActChamp){
        ctx.fillStyle = "rgba(143,211,49,0.10)";
        ctx.fillRect(x0, rowY, colW, rowH);
      }else if(isChamp){
        // "In line" for Champion Rush but hasn't won yet — a soft glow only,
        // no crown badge (that's reserved for actual Champions below).
        ctx.save();
        ctx.shadowColor = "rgba(143,211,49,0.6)";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = "rgba(143,211,49,0.55)";
        ctx.lineWidth = 1.4;
        roundRectPath(ctx, x0+1, rowY+2, colW-2, rowH-4, 8);
        ctx.stroke();
        ctx.restore();
      }

      // rank-color accent bar on the far left of the row
      let barColor = null;
      if(globalRank===0) barColor = "#c7f08a";
      else if(globalRank===1) barColor = "#c9d2e0";
      else if(globalRank===2) barColor = "#73c33e";
      if(barColor){
        ctx.fillStyle = barColor;
        ctx.fillRect(x0, rowY, 5, rowH);
      }

      // rank number
      ctx.textAlign = "center";
      ctx.font = "800 20px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillStyle = barColor || "#ffffff";
      ctx.fillText(String(globalRank+1), cx.rank+rankW/2, midY);

      // team logo
      const logoR = 20, logoCx = cx.team+26, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1c1c2e";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#a6df8a";
        ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.stroke();

      // team name (editable — pulled straight from the team record)
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? "#c7f08a" : "#ffffff";
      ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+22) - (isActChamp?26:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+14, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#c7f08a");
      }

      // stat columns
      ctx.textAlign = "center";
      ctx.fillStyle = "#dcd6f0";
      ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillStyle = "#dcd6f0";
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = "#c7f08a";
      ctx.fillText(String(r.wins), cx.booyah+booyahW/2, midY);

      ctx.fillStyle = "#86d278";
      ctx.font = "800 21px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

      // row divider
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
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

  // center divider with tournament-logo emblem
  ctx.strokeStyle = "rgba(176,106,255,0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midX, headerH);
  ctx.lineTo(midX, headerH+tableH);
  ctx.stroke();

  const emY = headerH+tableH/2, emR = 22;
  ctx.save();
  ctx.beginPath();
  ctx.arc(midX, emY, emR, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = "#1c1230";
  ctx.fill();
  ctx.clip();
  if(tourneyLogo){
    ctx.drawImage(tourneyLogo, midX-emR, emY-emR, emR*2, emR*2);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(176,106,255,0.5)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(midX, emY, emR, 0, Math.PI*2);
  ctx.stroke();

  /* ---- footer: editable tagline / description + date + page label ---- */
  const footY = headerH+tableH+22;
  ctx.strokeStyle = "rgba(176,106,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  // Tagline — left blank unless the user set a slogan, so a table without
  // one doesn't show forced placeholder copy.
  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#73b879";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+34);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#a68ad8";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8a7ab0";
    ctx.fillText(pageLabel, width-outerPad, footY+34);
  }

  if(sponsorLogos.length){
    // 0 to many partner logos, laid out right-to-left along the footer.
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 34 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#4a7951";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1c1230";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(176,106,255,0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Two Columns (6+6)" — same visual language as the Rank Table
   design above, just capped at 6 rows per column (12 teams per image) so a
   standard 12-team bracket fits neatly in ranked order, left column then
   right column. ---- */
export function renderRankTableTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderRankTableDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "One Column (12 Teams)" — every team listed top-to-bottom in
   ranked order in a single wide column. Same purple/black theme and same
   data (including Placement Pts) as the Rank Table design. ---- */
export function renderRankTableOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = 12; // single column, up to 12 teams per image
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const headerH = 210;
  const colHeadH = 56;
  const rowH = 66 + PORTRAIT.rowDelta;
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

  /* ---- background: near-black with purple corner glows ---- */
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0,0,width,height);

  function radialGlow(cx,cy,r,color){
    const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,color);
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height);
  }
  radialGlow(width*0.10, 30, 400, "rgba(150,70,235,0.30)");
  radialGlow(width*0.90, 30, 400, "rgba(150,70,235,0.30)");
  radialGlow(width*0.5, height, width*0.6, "rgba(90,30,140,0.12)");

  function cornerAccent(flip){
    ctx.save();
    if(flip){ ctx.translate(width,0); ctx.scale(-1,1); }
    const grad = ctx.createLinearGradient(0,0,210,88);
    grad.addColorStop(0,"#73c879");
    grad.addColorStop(1,"#155a35");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(190,0);
    ctx.lineTo(70,88);
    ctx.lineTo(0,88);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  cornerAccent(false);
  cornerAccent(true);

  /* ---- big tournament logo, top-left ---- */
  {
    const bigLogoR = 58, bigLogoCx = 112, bigLogoCy = 96;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1c1230";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(176,106,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  /* ---- title block ---- */
  ctx.textAlign = "center";

  ctx.save();
  ctx.shadowColor = "rgba(176,106,255,0.65)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 50px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-260), width/2, 106);
  ctx.restore();

  // Subtitle badge — left blank (no pill drawn) unless the user set one,
  // so a table without a season/event name doesn't show placeholder text.
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
    const seasonW = ctx.measureText(seasonLabel).width + 34;
    roundRectPath(ctx, width/2-seasonW/2, 126, seasonW, 30, 15);
    ctx.strokeStyle = "rgba(176,106,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#a6e68a";
    ctx.fillText(seasonLabel, width/2, 146);
  }

  if(champRush){
    ctx.font = "800 17px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#c7f08a";
    drawIconTextLine(ctx, width/2, seasonLabel ? 180 : 154, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:20});
  }

  /* ---- single wide column geometry ---- */
  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
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

  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);

  /* ---- column header ---- */
  const headY = headerH;
  roundRectPath(ctx, x0, headY, colW, colHeadH, 10);
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  ctx.fill();
  ctx.strokeStyle = "rgba(176,106,255,0.25)";
  ctx.lineWidth = 1;
  roundRectPath(ctx, x0, headY, colW, colHeadH, 10);
  ctx.stroke();

  const headMidY = headY+colHeadH/2+5;
  ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#a6df8a";
  ctx.textAlign = "center";
  ctx.fillText("#", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillStyle = "#e8e2ff";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillStyle = "#a6df8a";
  drawIconTextLine(ctx, cx.played+playedW/2, headMidY, [{icon:"flag"},{text:"PLAYED"}], {iconSize:11});
  drawIconTextLine(ctx, cx.kills+killsW/2, headMidY, [{icon:"target"},{text:"KILLS"}], {iconSize:11});
  ctx.fillStyle = "#e8e2ff";
  ctx.fillText("PLACE PTS", cx.placement+placementW/2, headMidY);
  ctx.fillStyle = "#c7f08a";
  drawIconTextLine(ctx, cx.booyah+booyahW/2, headMidY, [{icon:"trophy"},{text:"BOOYAH!"}], {iconSize:11});
  ctx.fillStyle = "#a6e68a";
  ctx.fillText("TOTAL PTS", cx.total+totalW/2, headMidY);

  /* ---- rows ---- */
  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isChamp = isChampionTeam(r.totalPoints);
    const isActChamp = isActualChampion(r.team.id);
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.018)" : "rgba(255,255,255,0.045)";
    ctx.fillRect(x0, rowY, colW, rowH);
    if(isActChamp){
      ctx.fillStyle = "rgba(143,211,49,0.10)";
      ctx.fillRect(x0, rowY, colW, rowH);
    }else if(isChamp){
      ctx.save();
      ctx.shadowColor = "rgba(143,211,49,0.6)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "rgba(143,211,49,0.55)";
      ctx.lineWidth = 1.4;
      roundRectPath(ctx, x0+1, rowY+2, colW-2, rowH-4, 8);
      ctx.stroke();
      ctx.restore();
    }

    let barColor = null;
    if(globalRank===0) barColor = "#c7f08a";
    else if(globalRank===1) barColor = "#c9d2e0";
    else if(globalRank===2) barColor = "#73c33e";
    if(barColor){
      ctx.fillStyle = barColor;
      ctx.fillRect(x0, rowY, 5, rowH);
    }

    ctx.textAlign = "center";
    ctx.font = "800 21px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = barColor || "#ffffff";
    ctx.fillText(String(globalRank+1), cx.rank+rankW/2, midY);

    const logoR = 21, logoCx = cx.team+27, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1c1c2e";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#a6df8a";
      ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = isActChamp ? "#c7f08a" : "#ffffff";
    ctx.font = "700 18px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+24) - (isActChamp?26:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+15, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#c7f08a");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#dcd6f0";
    ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = "#c7f08a";
    ctx.fillText(String(r.wins), cx.booyah+booyahW/2, midY);

    ctx.fillStyle = "#86d278";
    ctx.font = "800 22px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, rowY+rowH);
    ctx.lineTo(x0+colW, rowY+rowH);
    ctx.stroke();
  }

  /* ---- footer ---- */
  const footY = headerH+tableH+22;
  ctx.strokeStyle = "rgba(176,106,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  // Tagline — left blank unless the user set a slogan, so a table without
  // one doesn't show forced placeholder copy.
  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#73b879";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+34);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#a68ad8";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8a7ab0";
    ctx.fillText(pageLabel, width-outerPad, footY+34);
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
    ctx.fillStyle = "#4a7951";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1c1230";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(176,106,255,0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
