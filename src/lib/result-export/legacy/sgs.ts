// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, SGS_BANNER, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, playerPhotoOverRect, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "SGS Neon Sunset" — uses the SGS key-art banner (purple /
   magenta sunset, masked characters, falling dollar bills) as a hero
   header that fades into a deep-plum leaderboard. Gold / lavender / coral
   accents for the top 3, magenta→orange gradient chrome. Same column set
   (rank / team / played / kills / placement / booyah / total) as every
   other theme. ---- */

export function renderSgsDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol, singleColumn){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const single = !!singleColumn;
  rowsPerCol = single ? 12 : (rowsPerCol || 9);

  const leftRanks  = ranks.slice(0, rowsPerCol);
  const rightRanks = single ? [] : ranks.slice(rowsPerCol, rowsPerCol*2);
  const leftLogos  = logos.slice(0, rowsPerCol);
  const rightLogos = single ? [] : logos.slice(rowsPerCol, rowsPerCol*2);
  const numRows = Math.max(leftRanks.length, rightRanks.length, 1);

  const baseWidth = single ? (PORTRAIT.on ? PORTRAIT.width : 1100) : 1536;
  const outerPad = single ? 48 : 44;
  const bannerH = single ? 320 : 372;
  const headerH = bannerH + 18;          // table starts here
  const colHeadH = 46;
  const rowH = single ? 66 + PORTRAIT.rowDelta : 64;
  const midGap = 40;
  const footerH = 74 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-8);
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = single && PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 30;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // palette
  const BG_TOP = "#1a0628", BG_MID = "#2a0b3d", BG_BOT = "#180525";
  const PINK = "#ff4fa3", PURPLE = "#9b4be0", CORAL = "#ff8a4c", GOLD = "#ffd166", LAV = "#cdb8ff", MINT = "#6ee7a8";
  const medalOf = (g)=> g===0 ? GOLD : g===1 ? LAV : g===2 ? CORAL : null;

  /* ---- background ---- */
  const bg = ctx.createLinearGradient(0,0,0,height);
  bg.addColorStop(0, BG_TOP); bg.addColorStop(0.45, BG_MID); bg.addColorStop(1, BG_BOT);
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,width,height);
  let glow = ctx.createRadialGradient(0,height,0,0,height,width*0.55);
  glow.addColorStop(0,"rgba(255,79,163,0.20)"); glow.addColorStop(1,"rgba(255,79,163,0)");
  ctx.fillStyle = glow; ctx.fillRect(0,0,width,height);
  glow = ctx.createRadialGradient(width,height*0.6,0,width,height*0.6,width*0.5);
  glow.addColorStop(0,"rgba(155,75,224,0.22)"); glow.addColorStop(1,"rgba(155,75,224,0)");
  ctx.fillStyle = glow; ctx.fillRect(0,0,width,height);

  /* ---- hero banner (cover-fit, cropped from the top so the SGS mark
     and masked character stay in frame) ---- */
  ctx.save();
  ctx.beginPath(); ctx.rect(0,0,width,bannerH); ctx.clip();
  if(SGS_BANNER.img && SGS_BANNER.img.complete && SGS_BANNER.img.naturalWidth){
    const iw = SGS_BANNER.img.naturalWidth, ih = SGS_BANNER.img.naturalHeight;
    const scale = width/iw;
    const srcH = bannerH/scale;
    const sy = Math.min(Math.max(0, ih - srcH), single ? 10 : 6);
    ctx.drawImage(SGS_BANNER.img, 0, sy, iw, srcH, 0, 0, width, bannerH);
  }else{
    const fb = ctx.createLinearGradient(0,0,width,bannerH);
    fb.addColorStop(0,"#b0317e"); fb.addColorStop(0.5,"#7b3aa6"); fb.addColorStop(1,"#d1456f");
    ctx.fillStyle = fb; ctx.fillRect(0,0,width,bannerH);
  }
  // soft dark fade into the leaderboard so the title stays readable
  const fade = ctx.createLinearGradient(0, bannerH*0.30, 0, bannerH);
  fade.addColorStop(0,"rgba(26,6,40,0)");
  fade.addColorStop(0.70,"rgba(26,6,40,0.78)");
  fade.addColorStop(1,BG_MID);
  ctx.fillStyle = fade;
  ctx.fillRect(0,0,width,bannerH);
  ctx.restore();

  // gradient accent line under the banner
  const line = ctx.createLinearGradient(outerPad,0,width-outerPad,0);
  line.addColorStop(0,"rgba(255,79,163,0)"); line.addColorStop(0.2,PINK); line.addColorStop(0.5,CORAL); line.addColorStop(0.8,PURPLE); line.addColorStop(1,"rgba(155,75,224,0)");
  ctx.fillStyle = line;
  ctx.fillRect(outerPad, bannerH+2, width-outerPad*2, 3);

  /* ---- tournament logo, top-right ---- */
  {
    const r = single ? 40 : 46, cx = width-outerPad-r, cy = outerPad+r-4;
    ctx.save();
    ctx.shadowColor = "rgba(255,79,163,0.55)"; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.closePath();
    ctx.fillStyle = "#1a0628"; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.closePath(); ctx.clip();
    if(tourneyLogo) ctx.drawImage(tourneyLogo, cx-r, cy-r, r*2, r*2);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  }

  /* ---- champion rush pill, top-left ---- */
  if(champRush){
    const pw = 190, ph = 34, px = outerPad, py = outerPad-4;
    roundRectPath(ctx, px, py, pw, ph, ph/2);
    const pg = ctx.createLinearGradient(px,0,px+pw,0);
    pg.addColorStop(0,"rgba(255,209,102,0.95)"); pg.addColorStop(1,"rgba(255,138,76,0.95)");
    ctx.fillStyle = pg; ctx.fill();
    ctx.font = "900 15px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#2a0b3d";
    drawIconTextLine(ctx, px+pw/2, py+ph/2+5, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:17, align:"center"});
  }

  /* ---- title block, centered over the fade ---- */
  ctx.textAlign = "center";
  const titleMaxW = width - outerPad*2 - (single ? 120 : 260);
  ctx.save();
  ctx.shadowColor = "rgba(255,79,163,0.75)"; ctx.shadowBlur = 22;
  ctx.fillStyle = "#ffffff";
  const sgsTitle = (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase();
  let sgsTitleSize = single ? 46 : 58;
  ctx.font = "900 " + sgsTitleSize + "px Rajdhani, 'Segoe UI', sans-serif";
  // shrink long tournament names to fit before resorting to an ellipsis
  while(sgsTitleSize > 30 && ctx.measureText(sgsTitle).width > titleMaxW){
    sgsTitleSize -= 2;
    ctx.font = "900 " + sgsTitleSize + "px Rajdhani, 'Segoe UI', sans-serif";
  }
  ctx.fillText(fitCanvasText(ctx, sgsTitle, titleMaxW), width/2, bannerH-58);
  ctx.restore();

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  {
    const label = seasonLabel ? seasonLabel + "  •  TEAM RANKING" : "TEAM RANKING";
    ctx.font = "800 " + (single ? 15 : 17) + "px Rajdhani, 'Segoe UI', sans-serif";
    if("letterSpacing" in ctx) ctx.letterSpacing = "3px";
    ctx.fillStyle = "#ffc2e2";
    ctx.fillText(fitCanvasText(ctx, label, titleMaxW), width/2, bannerH-26);
    if("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }

  /* ---- column geometry ---- */
  const colW = single ? (width - outerPad*2 - gutter) : (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const rankW = single ? 76 : 62, playedW = single ? 92 : 62, killsW = single ? 92 : 62;
  const placementW = single ? 100 : 78, booyahW = single ? 100 : 78, totalW = single ? 124 : 100;
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
    const y = headerH;
    roundRectPath(ctx, x0, y, colW, colHeadH-8, 10);
    const hg = ctx.createLinearGradient(x0,0,x0+colW,0);
    hg.addColorStop(0,"#d63a93"); hg.addColorStop(0.55,"#9b3fd0"); hg.addColorStop(1,"#6f3bd6");
    ctx.fillStyle = hg; ctx.fill();
    playerPhotoOverRect(ctx, photo, x0, y, colW, colHeadH-8, 10);
    const midY = y + (colHeadH-8)/2 + 5;
    ctx.font = "800 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("#", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+10, midY);
    ctx.textAlign = "center";
    ctx.fillText("PLAYED", cx.played+playedW/2, midY);
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
      const isActChamp = isActualChampion(r.team.id);
      const medal = medalOf(globalRank);
      const rowY = headerH + colHeadH + i*rowH;
      const bx = x0, by = rowY+3, bw = colW, bh = rowH-6;
      const midY = rowY + rowH/2 + 6;

      // row panel
      roundRectPath(ctx, bx, by, bw, bh, 12);
      if(medal){
        const rg = ctx.createLinearGradient(bx,0,bx+bw,0);
        rg.addColorStop(0, medal + "4d");
        rg.addColorStop(0.6, "rgba(255,255,255,0.06)");
        rg.addColorStop(1, "rgba(255,255,255,0.04)");
        ctx.fillStyle = rg;
      }else{
        ctx.fillStyle = i%2===0 ? "rgba(255,255,255,0.065)" : "rgba(255,255,255,0.035)";
      }
      ctx.fill();
      ctx.strokeStyle = medal ? medal + "66" : "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if(medal){
        roundRectPath(ctx, bx, by+8, 4, bh-16, 2);
        ctx.fillStyle = medal; ctx.fill();
      }
      if(isActChamp){
        roundRectPath(ctx, bx+1, by+1, bw-2, bh-2, 12);
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1.8; ctx.stroke();
      }

      // rank badge
      const brx = cx.rank+rankW/2, bry = rowY+rowH/2;
      ctx.beginPath(); ctx.arc(brx, bry, 17, 0, Math.PI*2);
      if(medal){
        const bgr = ctx.createLinearGradient(brx-17,bry-17,brx+17,bry+17);
        bgr.addColorStop(0, "#ffffff"); bgr.addColorStop(0.25, medal); bgr.addColorStop(1, medal);
        ctx.fillStyle = bgr; ctx.fill();
      }else{
        ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.textAlign = "center";
      ctx.font = "900 18px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillStyle = medal ? "#2a0b3d" : LAV;
      ctx.fillText(String(globalRank+1), brx, midY);

      // team logo
      const logoR = 21, logoCx = cx.team+30, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath(); ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2); ctx.closePath();
      ctx.fillStyle = "#1a0628"; ctx.fill(); ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = PINK;
        ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+6);
      }
      ctx.restore();
      ctx.strokeStyle = medal || "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2); ctx.stroke();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? GOLD : "#ffffff";
      ctx.font = "700 " + (single ? 20 : 18) + "px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+26) - (isActChamp?26:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+14, midY);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-16, midY-7, 16, GOLD);
      }

      // stats
      ctx.textAlign = "center";
      ctx.fillStyle = "#e6d7f7";
      ctx.font = "700 16px Inter, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? MINT : "rgba(255,255,255,0.25)";
      ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

      // total in a pill
      const tw = totalW-22, th = 34, tx = cx.total+11, ty = rowY+rowH/2-th/2;
      roundRectPath(ctx, tx, ty, tw, th, th/2);
      if(medal){
        ctx.fillStyle = medal;
      }else{
        const tg = ctx.createLinearGradient(tx,0,tx+tw,0);
        tg.addColorStop(0,"rgba(255,79,163,0.85)"); tg.addColorStop(1,"rgba(155,75,224,0.85)");
        ctx.fillStyle = tg;
      }
      ctx.fill();
      ctx.fillStyle = medal ? "#2a0b3d" : "#ffffff";
      ctx.font = "900 20px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY-1);
    }
  }

  drawPlayerPhoto(ctx, photo, single ? [[leftX, headerH, colW, tableH]] : [[leftX, headerH, colW, tableH],[rightX, headerH, colW, tableH]]);
  drawColumnHeader(leftX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  if(!single){
    drawColumnHeader(rightX);
    drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);
  }

  /* ---- footer ---- */
  const footY = headerH + tableH + 18;
  const fl = ctx.createLinearGradient(outerPad,0,width-outerPad,0);
  fl.addColorStop(0,"rgba(255,79,163,0)"); fl.addColorStop(0.5,"rgba(255,79,163,0.55)"); fl.addColorStop(1,"rgba(155,75,224,0)");
  ctx.fillStyle = fl;
  ctx.fillRect(outerPad, footY, width-outerPad*2, 2);

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#e9a6cf";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(fitCanvasText(ctx, tagline, width - outerPad*2 - 520), width/2, footY+38);
  }
  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffc2e2";
    ctx.fillText(dateLabel, outerPad, footY+38);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#b58fd6";
    ctx.fillText(pageLabel, width-outerPad, footY+38);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 38 + 32;
    let sLogoCx = width - outerPad - sLogoR;
    const totalWs = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#b58fd6";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath(); ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2); ctx.closePath();
      ctx.fillStyle = "#1a0628"; ctx.fill(); ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2); ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* "SGS Neon Sunset" — Two Columns (6+6): 6 rows per column, 12 teams per image. */
export function renderSgsTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderSgsDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6, false);
}

/* "SGS Neon Sunset" — One Column (12 Teams): single wide column. */
export function renderSgsOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderSgsDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 12, true);
}
