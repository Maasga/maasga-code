export interface Quartier {
  name: string
  arrondissement: number
  lat?: number
  lng?: number
}

export const quartiers: Quartier[] = [
  // Arrondissement 1
  { name: "Bilbalogo", arrondissement: 1, lat: 12.3656, lng: -1.5197 },
  { name: "Saint Léon", arrondissement: 1, lat: 12.3645, lng: -1.5203 },
  { name: "Zangouettin", arrondissement: 1, lat: 12.3654, lng: -1.5210 },
  { name: "Tiedpalogo", arrondissement: 1, lat: 12.3663, lng: -1.5215 },
  { name: "Koulouba", arrondissement: 1, lat: 12.3651, lng: -1.5220 },
  { name: "Kamsonghin", arrondissement: 1, lat: 12.3642, lng: -1.5208 },
  { name: "Samandin", arrondissement: 1, lat: 12.3660, lng: -1.5200 },
  { name: "Gounghin Sud", arrondissement: 1, lat: 12.3648, lng: -1.5190 },
  { name: "Gandin", arrondissement: 1, lat: 12.3655, lng: -1.5225 },
  { name: "Kouritenga", arrondissement: 1, lat: 12.3670, lng: -1.5230 },
  { name: "Mankougoudou", arrondissement: 1, lat: 12.3675, lng: -1.5205 },

  // Arrondissement 2
  { name: "Paspanga", arrondissement: 2, lat: 12.3710, lng: -1.5150 },
  { name: "Ouidi", arrondissement: 2, lat: 12.3720, lng: -1.5160 },
  { name: "Larlé", arrondissement: 2, lat: 12.3705, lng: -1.5170 },
  { name: "Kologh Naba", arrondissement: 2, lat: 12.3715, lng: -1.5145 },
  { name: "Dapoya 2", arrondissement: 2, lat: 12.3725, lng: -1.5155 },
  { name: "Nemnin", arrondissement: 2, lat: 12.3708, lng: -1.5165 },
  { name: "Niogsin", arrondissement: 2, lat: 12.3712, lng: -1.5175 },
  { name: "Hamdalaye", arrondissement: 2, lat: 12.3718, lng: -1.5140 },
  { name: "Gounghin Nord", arrondissement: 2, lat: 12.3722, lng: -1.5148 },
  { name: "Baoghin", arrondissement: 2, lat: 12.3730, lng: -1.5158 },

  // Arrondissement 3
  { name: "Camp militaire", arrondissement: 3, lat: 12.3580, lng: -1.5100 },
  { name: "Naababpougo", arrondissement: 3, lat: 12.3590, lng: -1.5095 },
  { name: "Kienbaoghin", arrondissement: 3, lat: 12.3598, lng: -1.5105 },
  { name: "Zongo", arrondissement: 3, lat: 12.3585, lng: -1.5110 },
  { name: "Koumdayonré", arrondissement: 3, lat: 12.3605, lng: -1.5100 },
  { name: "Nonsin", arrondissement: 3, lat: 12.3595, lng: -1.5115 },
  { name: "Rimkièta", arrondissement: 3, lat: 12.3588, lng: -1.5088 },
  { name: "Tampouy", arrondissement: 3, lat: 12.3610, lng: -1.5095 },
  { name: "Kilwin", arrondissement: 3, lat: 12.3592, lng: -1.5120 },

  // Arrondissement 4
  { name: "Tanghin", arrondissement: 4, lat: 12.3520, lng: -1.5050 },
  { name: "Sambin barrage", arrondissement: 4, lat: 12.3530, lng: -1.5060 },
  { name: "Somgandé", arrondissement: 4, lat: 12.3525, lng: -1.5045 },
  { name: "Zone industrielle", arrondissement: 4, lat: 12.3540, lng: -1.5055 },
  { name: "Nioko 2", arrondissement: 4, lat: 12.3535, lng: -1.5040 },
  { name: "Bendogo", arrondissement: 4, lat: 12.3515, lng: -1.5065 },
  { name: "Toukin", arrondissement: 4, lat: 12.3545, lng: -1.5050 },

  // Arrondissement 5
  { name: "Zogona", arrondissement: 5, lat: 12.3650, lng: -1.4950 },
  { name: "Wemtenga", arrondissement: 5, lat: 12.3660, lng: -1.4960 },
  { name: "Dagnoën", arrondissement: 5, lat: 12.3645, lng: -1.4945 },
  { name: "Ronsin", arrondissement: 5, lat: 12.3655, lng: -1.4955 },
  { name: "Kalgondin", arrondissement: 5, lat: 12.3670, lng: -1.4940 },

  // Arrondissement 6
  { name: "Cissin", arrondissement: 6, lat: 12.3720, lng: -1.5000 },
  { name: "Kouritenga", arrondissement: 6, lat: 12.3730, lng: -1.5010 },
  { name: "Pissy", arrondissement: 6, lat: 12.3710, lng: -1.4990 },

  // Arrondissement 7
  { name: "Nagrin", arrondissement: 7, lat: 12.3780, lng: -1.5050 },
  { name: "Yaoghin", arrondissement: 7, lat: 12.3790, lng: -1.5060 },
  { name: "Sandogo", arrondissement: 7, lat: 12.3770, lng: -1.5040 },
  { name: "Kankasin", arrondissement: 7, lat: 12.3785, lng: -1.5055 },
  { name: "Boassa", arrondissement: 7, lat: 12.3795, lng: -1.5045 },

  // Arrondissement 8
  { name: "Zaghtouli", arrondissement: 8, lat: 12.3650, lng: -1.5250 },
  { name: "Zongo Nabitenga", arrondissement: 8, lat: 12.3660, lng: -1.5260 },
  { name: "Sogpèlcé", arrondissement: 8, lat: 12.3640, lng: -1.5245 },
  { name: "Bissighin", arrondissement: 8, lat: 12.3670, lng: -1.5255 },
  { name: "Bassinko", arrondissement: 8, lat: 12.3655, lng: -1.5270 },
  { name: "Dar-es-Salam", arrondissement: 8, lat: 12.3665, lng: -1.5240 },
  { name: "Silmiougou", arrondissement: 8, lat: 12.3645, lng: -1.5265 },
  { name: "Gantin", arrondissement: 8, lat: 12.3675, lng: -1.5250 },

  // Arrondissement 9
  { name: "Bangpooré", arrondissement: 9, lat: 12.3580, lng: -1.5300 },
  { name: "Larlé Wéogo", arrondissement: 9, lat: 12.3590, lng: -1.5310 },
  { name: "Marcoussis", arrondissement: 9, lat: 12.3570, lng: -1.5290 },
  { name: "Silmiyiri", arrondissement: 9, lat: 12.3600, lng: -1.5305 },
  { name: "Wob Riguéré", arrondissement: 9, lat: 12.3585, lng: -1.5315 },
  { name: "Ouapassi", arrondissement: 9, lat: 12.3595, lng: -1.5295 },

  // Arrondissement 10
  { name: "Kossodo", arrondissement: 10, lat: 12.3500, lng: -1.5150 },
  { name: "Wayalghin", arrondissement: 10, lat: 12.3510, lng: -1.5160 },
  { name: "Godin", arrondissement: 10, lat: 12.3490, lng: -1.5140 },
  { name: "Nioko 1", arrondissement: 10, lat: 12.3505, lng: -1.5155 },
  { name: "Dassosgho", arrondissement: 10, lat: 12.3515, lng: -1.5145 },
  { name: "Taabtenga", arrondissement: 10, lat: 12.3495, lng: -1.5165 },

  // Arrondissement 11
  { name: "Dassasgo", arrondissement: 11, lat: 12.3450, lng: -1.5120 },
  { name: "Yemtenga", arrondissement: 11, lat: 12.3460, lng: -1.5130 },
  { name: "Karpala", arrondissement: 11, lat: 12.3440, lng: -1.5110 },
  { name: "Balkuy", arrondissement: 11, lat: 12.3470, lng: -1.5125 },
  { name: "Lanoayiri", arrondissement: 11, lat: 12.3455, lng: -1.5135 },
  { name: "Dayongo", arrondissement: 11, lat: 12.3465, lng: -1.5115 },
  { name: "Ouidtenga", arrondissement: 11, lat: 12.3445, lng: -1.5140 }
]

export const quartiersByArrondissement = () => {
  const result: { [key: number]: Quartier[] } = {}
  for (let i = 1; i <= 11; i++) {
    result[i] = quartiers.filter(q => q.arrondissement === i)
  }
  return result
}
