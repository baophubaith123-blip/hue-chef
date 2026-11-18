import noiNoiAnMung from '@/assets/theme-d/noi-noi/noi-noi-an-mung.webp';
import noiNoiBeNoi from '@/assets/theme-d/noi-noi/noi-noi-be-noi.webp';
import noiNoiBuon from '@/assets/theme-d/noi-noi/noi-noi-buon.webp';
import noiNoiCamMuong from '@/assets/theme-d/noi-noi/noi-noi-cam-muong.webp';
import noiNoiChao from '@/assets/theme-d/noi-noi/noi-noi-chao.webp';
import noiNoiChiTay from '@/assets/theme-d/noi-noi/noi-noi-chi-tay.webp';
import noiNoiDoiNon from '@/assets/theme-d/noi-noi/noi-noi-doi-non.webp';
import noiNoiGioiThieu from '@/assets/theme-d/noi-noi/noi-noi-gioi-thieu.webp';
import noiNoiHoang from '@/assets/theme-d/noi-noi/noi-noi-hoang.webp';
import noiNoiKeoXe from '@/assets/theme-d/noi-noi/noi-noi-keo-xe.webp';
import noiNoiKhuay from '@/assets/theme-d/noi-noi/noi-noi-khuay.webp';
import noiNoiMc from '@/assets/theme-d/noi-noi/noi-noi-mc.webp';
import noiNoiNgu from '@/assets/theme-d/noi-noi/noi-noi-ngu.webp';
import noiNoiVui from '@/assets/theme-d/noi-noi/noi-noi-vui.webp';

import khachGiauBinhThuong from '@/assets/theme-d/customers/khach-giau-binh-thuong.webp';
import khachGiauBuon from '@/assets/theme-d/customers/khach-giau-buon.webp';
import khachGiauNgacNhien from '@/assets/theme-d/customers/khach-giau-ngac-nhien.webp';
import khachGiauSotRuot from '@/assets/theme-d/customers/khach-giau-sot-ruot.webp';
import khachGiauTucGian from '@/assets/theme-d/customers/khach-giau-tuc-gian.webp';
import khachGiauVui from '@/assets/theme-d/customers/khach-giau-vui.webp';
import khachThuongBinhThuong from '@/assets/theme-d/customers/khach-thuong-binh-thuong.webp';
import khachThuongBuon from '@/assets/theme-d/customers/khach-thuong-buon.webp';
import khachThuongNgacNhien from '@/assets/theme-d/customers/khach-thuong-ngac-nhien.webp';
import khachThuongSotRuot from '@/assets/theme-d/customers/khach-thuong-sot-ruot.webp';
import khachThuongTucGian from '@/assets/theme-d/customers/khach-thuong-tuc-gian.webp';
import khachThuongVui from '@/assets/theme-d/customers/khach-thuong-vui.webp';
import khachVipBinhThuong from '@/assets/theme-d/customers/khach-vip-binh-thuong.webp';
import khachVipBuon from '@/assets/theme-d/customers/khach-vip-buon.webp';
import khachVipNgacNhien from '@/assets/theme-d/customers/khach-vip-ngac-nhien.webp';
import khachVipSotRuot from '@/assets/theme-d/customers/khach-vip-sot-ruot.webp';
import khachVipTucGian from '@/assets/theme-d/customers/khach-vip-tuc-gian.webp';
import khachVipVui from '@/assets/theme-d/customers/khach-vip-vui.webp';

import giamKhao from '@/assets/theme-d/giam-khao.webp';
import sceneBanDoHue from '@/assets/theme-d/scenes/ban-do-hue.webp';
import sceneBanHoanThien from '@/assets/theme-d/scenes/ban-hoan-thien.webp';
import sceneBep from '@/assets/theme-d/scenes/bep.webp';
import sceneCanhQuay from '@/assets/theme-d/scenes/canh-quay.webp';
import sceneCho from '@/assets/theme-d/scenes/cho.webp';
import sceneNenXepHang from '@/assets/theme-d/scenes/nen-xep-hang.webp';
import sceneNguThien from '@/assets/theme-d/scenes/ngu-thien.webp';
import sceneSanKhauHoiDap from '@/assets/theme-d/scenes/san-khau-hoi-dap.webp';
import sceneSanLeHoi from '@/assets/theme-d/scenes/san-le-hoi.webp';

export type NoiNoiPose =
  | 'chao'
  | 'chi-tay'
  | 'be-noi'
  | 'keo-xe'
  | 'mc'
  | 'an-mung'
  | 'buon'
  | 'ngu'
  | 'cam-muong'
  | 'doi-non'
  | 'vui'
  | 'hoang'
  | 'khuay'
  | 'gioi-thieu';

export const NOI_NOI_POSES: Record<NoiNoiPose, string> = {
  chao: noiNoiChao,
  'chi-tay': noiNoiChiTay,
  'be-noi': noiNoiBeNoi,
  'keo-xe': noiNoiKeoXe,
  mc: noiNoiMc,
  'an-mung': noiNoiAnMung,
  buon: noiNoiBuon,
  ngu: noiNoiNgu,
  'cam-muong': noiNoiCamMuong,
  'doi-non': noiNoiDoiNon,
  vui: noiNoiVui,
  hoang: noiNoiHoang,
  khuay: noiNoiKhuay,
  'gioi-thieu': noiNoiGioiThieu,
};

export type CustomerTier = 'thuong' | 'giau' | 'vip';
export type CustomerMood = 'vui' | 'binh-thuong' | 'sot-ruot' | 'tuc-gian' | 'buon' | 'ngac-nhien';

export const CUSTOMER_TIERS: CustomerTier[] = ['thuong', 'giau', 'vip'];
export const CUSTOMER_MOODS: CustomerMood[] = ['vui', 'binh-thuong', 'sot-ruot', 'tuc-gian', 'buon', 'ngac-nhien'];

export const CUSTOMER_FACES: Record<CustomerTier, Record<CustomerMood, string>> = {
  thuong: {
    vui: khachThuongVui,
    'binh-thuong': khachThuongBinhThuong,
    'sot-ruot': khachThuongSotRuot,
    'tuc-gian': khachThuongTucGian,
    buon: khachThuongBuon,
    'ngac-nhien': khachThuongNgacNhien,
  },
  giau: {
    vui: khachGiauVui,
    'binh-thuong': khachGiauBinhThuong,
    'sot-ruot': khachGiauSotRuot,
    'tuc-gian': khachGiauTucGian,
    buon: khachGiauBuon,
    'ngac-nhien': khachGiauNgacNhien,
  },
  vip: {
    vui: khachVipVui,
    'binh-thuong': khachVipBinhThuong,
    'sot-ruot': khachVipSotRuot,
    'tuc-gian': khachVipTucGian,
    buon: khachVipBuon,
    'ngac-nhien': khachVipNgacNhien,
  },
};

export type SceneKey =
  | 'san-le-hoi'
  | 'cho'
  | 'bep'
  | 'ban-hoan-thien'
  | 'san-khau-hoi-dap'
  | 'nen-xep-hang'
  | 'canh-quay'
  | 'ban-do-hue'
  | 'ngu-thien';

export const SCENES: Record<SceneKey, string> = {
  'san-le-hoi': sceneSanLeHoi,
  cho: sceneCho,
  bep: sceneBep,
  'ban-hoan-thien': sceneBanHoanThien,
  'san-khau-hoi-dap': sceneSanKhauHoiDap,
  'nen-xep-hang': sceneNenXepHang,
  'canh-quay': sceneCanhQuay,
  'ban-do-hue': sceneBanDoHue,
  'ngu-thien': sceneNguThien,
};

/** The imperial head chef who judges every Ngự thiện boss stage (Gói H3). */
export const BOSS_JUDGE_IMAGE = giamKhao;
