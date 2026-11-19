import dishCheDauXanh from '@/assets/theme-d/dishes/che-dau-xanh.webp';
import dishBanhUot from '@/assets/theme-d/dishes/banh-uot.webp';
import dishBanhCuon from '@/assets/theme-d/dishes/banh-cuon.webp';
import dishCheTroiNuoc from '@/assets/theme-d/dishes/che-troi-nuoc.webp';
import dishBanhDap from '@/assets/theme-d/dishes/banh-dap.webp';
import dishVaTron from '@/assets/theme-d/dishes/va-tron.webp';
import dishBunRieu from '@/assets/theme-d/dishes/bun-rieu.webp';
import dishMiQuang from '@/assets/theme-d/dishes/mi-quang.webp';
import dishCaoLau from '@/assets/theme-d/dishes/cao-lau.webp';
import dishBanhItTran from '@/assets/theme-d/dishes/banh-it-tran.webp';
import dishBanhDuc from '@/assets/theme-d/dishes/banh-duc.webp';
import dishMitTron from '@/assets/theme-d/dishes/mit-tron.webp';
import dishXoiGa from '@/assets/theme-d/dishes/xoi-ga.webp';
import dishGoiCuon from '@/assets/theme-d/dishes/goi-cuon.webp';
import dishCheSuongSa from '@/assets/theme-d/dishes/che-suong-sa.webp';
import dishBanhPhuThe from '@/assets/theme-d/dishes/banh-phu-the.webp';
import dishTomChua from '@/assets/theme-d/dishes/tom-chua.webp';
import dishBunNghe from '@/assets/theme-d/dishes/bun-nghe.webp';
import dishBanhTrangCuon from '@/assets/theme-d/dishes/banh-trang-cuon.webp';
import dishComGaHoiAn from '@/assets/theme-d/dishes/com-ga-hoi-an.webp';
import dishCaKhoTo from '@/assets/theme-d/dishes/ca-kho-to.webp';
import dishThitKhoTau from '@/assets/theme-d/dishes/thit-kho-tau.webp';
import dishCanhChuaCa from '@/assets/theme-d/dishes/canh-chua-ca.webp';
import dishBoKho from '@/assets/theme-d/dishes/bo-kho.webp';
import dishMucRimMe from '@/assets/theme-d/dishes/muc-rim-me.webp';
import dishBunCaNgu from '@/assets/theme-d/dishes/bun-ca-ngu.webp';
import dishVitNauChao from '@/assets/theme-d/dishes/vit-nau-chao.webp';
import dishTomSuNuong from '@/assets/theme-d/dishes/tom-su-nuong.webp';
import dishHeoQuay from '@/assets/theme-d/dishes/heo-quay.webp';
import dishGaNuongMuoiOt from '@/assets/theme-d/dishes/ga-nuong-muoi-ot.webp';
import dishLauBo from '@/assets/theme-d/dishes/lau-bo.webp';
import dishChaTom from '@/assets/theme-d/dishes/cha-tom.webp';
import dishCheToYen from '@/assets/theme-d/dishes/che-to-yen.webp';
import dishNemCong from '@/assets/theme-d/dishes/nem-cong.webp';
import dishChaPhuong from '@/assets/theme-d/dishes/cha-phuong.webp';
import dishCheHatSen from '@/assets/theme-d/dishes/che-hat-sen.webp';
import dishCheBap from '@/assets/theme-d/dishes/che-bap.webp';
import dishBanhBeo from '@/assets/theme-d/dishes/banh-beo.webp';
import dishBanhNam from '@/assets/theme-d/dishes/banh-nam.webp';
import dishBanhBotLoc from '@/assets/theme-d/dishes/banh-bot-loc.webp';
import dishBanhLoc from '@/assets/theme-d/dishes/banh-loc.webp';
import dishNemLui from '@/assets/theme-d/dishes/nem-lui.webp';
import dishBanhXeo from '@/assets/theme-d/dishes/banh-xeo.webp';
import dishBunMam from '@/assets/theme-d/dishes/bun-mam.webp';
import dishBunThitNuong from '@/assets/theme-d/dishes/bun-thit-nuong.webp';
import dishBanhKhoai from '@/assets/theme-d/dishes/banh-khoai.webp';
import dishBanhCanh from '@/assets/theme-d/dishes/banh-canh.webp';
import dishBunBoHue from '@/assets/theme-d/dishes/bun-bo-hue.webp';
import dishComHen from '@/assets/theme-d/dishes/com-hen.webp';
import dishComAmPhu from '@/assets/theme-d/dishes/com-am-phu.webp';

/** Hand-drawn Theme D illustrations for every dish, keyed by recipe id. */
export const DISH_ART: Record<string, string> = {
  'che-dau-xanh': dishCheDauXanh,
  'banh-uot': dishBanhUot,
  'banh-cuon': dishBanhCuon,
  'che-troi-nuoc': dishCheTroiNuoc,
  'banh-dap': dishBanhDap,
  'va-tron': dishVaTron,
  'bun-rieu': dishBunRieu,
  'mi-quang': dishMiQuang,
  'cao-lau': dishCaoLau,
  'banh-it-tran': dishBanhItTran,
  'banh-duc': dishBanhDuc,
  'mit-tron': dishMitTron,
  'xoi-ga': dishXoiGa,
  'goi-cuon': dishGoiCuon,
  'che-suong-sa': dishCheSuongSa,
  'banh-phu-the': dishBanhPhuThe,
  'tom-chua': dishTomChua,
  'bun-nghe': dishBunNghe,
  'banh-trang-cuon': dishBanhTrangCuon,
  'com-ga-hoi-an': dishComGaHoiAn,
  'ca-kho-to': dishCaKhoTo,
  'thit-kho-tau': dishThitKhoTau,
  'canh-chua-ca': dishCanhChuaCa,
  'bo-kho': dishBoKho,
  'muc-rim-me': dishMucRimMe,
  'bun-ca-ngu': dishBunCaNgu,
  'vit-nau-chao': dishVitNauChao,
  'tom-su-nuong': dishTomSuNuong,
  'heo-quay': dishHeoQuay,
  'ga-nuong-muoi-ot': dishGaNuongMuoiOt,
  'lau-bo': dishLauBo,
  'cha-tom': dishChaTom,
  'che-to-yen': dishCheToYen,
  'nem-cong': dishNemCong,
  'cha-phuong': dishChaPhuong,
  'che-hat-sen': dishCheHatSen,
  'che-bap': dishCheBap,
  'banh-beo': dishBanhBeo,
  'banh-nam': dishBanhNam,
  'banh-bot-loc': dishBanhBotLoc,
  'banh-loc': dishBanhLoc,
  'nem-lui': dishNemLui,
  'banh-xeo': dishBanhXeo,
  'bun-mam': dishBunMam,
  'bun-thit-nuong': dishBunThitNuong,
  'banh-khoai': dishBanhKhoai,
  'banh-canh': dishBanhCanh,
  'bun-bo-hue': dishBunBoHue,
  'com-hen': dishComHen,
  'com-am-phu': dishComAmPhu,
};

export function dishArtFor(recipe: { id: string; image: string }): string {
  return DISH_ART[recipe.id] ?? recipe.image;
}
