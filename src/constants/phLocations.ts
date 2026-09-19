export interface CityData {
  name: string;
  barangays?: string[];
}

export interface ProvinceData {
  name: string;
  cities: CityData[];
}

export interface RegionData {
  name: string;
  code: string;
  provinces: ProvinceData[];
}

export const PH_REGIONS: RegionData[] = [
  {
    name: "Region III (Central Luzon)",
    code: "REGION-III",
    provinces: [
      {
        name: "Pampanga",
        cities: [
          {
            name: "City of San Fernando",
            barangays: [
              "Alasaspas", "Baliti", "Bulaon", "Calulut", "Dela Paz Norte", "Dela Paz Sur",
              "Del Carmen", "Del Pilar", "Del Rosario", "Dolores", "Juliana", "Lara",
              "Lourdes", "Magliman", "Maimpis", "Malino", "Malpitic", "Pandacaqui",
              "Panipuan", "Pulung Bulu", "Quebiawan", "Saguin", "San Agustin", "San Felipe",
              "San Isidro", "San Jose", "San Juan", "San Nicolas", "San Pedro", "Santa Lucia",
              "Santa Teresita", "Santo Niño", "Sindalan", "Telabastagan"
            ]
          },
          {
            name: "Angeles City",
            barangays: [
              "Agapito del Rosario", "Amsic", "Anunas", "Balibago", "Capaya", "Claro M. Recto",
              "Cuayan", "Cutcut", "Cutud", "Lourdes North West", "Lourdes Sur", "Lourdes Sur East",
              "Malabanias", "Margot", "Mining", "Ninoy Aquino", "Pampang", "Pandan",
              "Pulungbulu", "Pulung Cacutud", "Pulung Maragul", "Salapungan", "San Jose",
              "San Nicolas", "Santa Teresita", "Santa Trinidad", "Santo Cristo", "Santo Domingo",
              "Santo Rosario", "Sapalibutad", "Tabun", "Virgen Delos Remedios"
            ]
          },
          {
            name: "Mabalacat City",
            barangays: [
              "Atlu-Bola", "Bical", "Bundagul", "Cacutud", "Calumpang", "Camachiles", "Dapdap",
              "Dau", "Dolores", "Duquit", "Lakandula", "Mabiga", "Macapagal Village", "Mamatitang",
              "Mangalit", "Marcos Village", "Mawaque", "Paralayunan", "Poblacion", "San Francisco",
              "San Joaquin", "Santa Ines", "Santa Maria", "Santo Rosario", "Sapang Balen", "Sapang Biabas", "Tabun"
            ]
          },
          {
            name: "Mexico",
            barangays: ["Acli", "Anao", "Camuning", "Divisoria", "Dolores", "Lagundi", "Masamat", "Nueva Victoria", "Pandacaqui", "Pangatlan", "Parian", "Sabanilla", "San Antonio", "San Carlos", "San Jose Malino", "San Juan", "San Lorenzo", "San Miguel", "San Nicolas", "San Patricio", "San Rafael", "San Roque", "San Vicente", "Santa Cruz", "Santa Maria", "Santo Cristo", "Santo Domingo", "Santo Rosario", "Sapang Maisac", "Suclaban", "Tangle"]
          },
          {
            name: "Guagua",
            barangays: ["Ascomo", "Bancal", "Betis", "Lambac", "Magsaysay", "Maquiapo", "Natividad", "Plaza Burgos", "Pulungmasle", "Rizal", "San Agustin", "San Antonio", "San Isidro", "San Jose", "San Juan Bautista", "San Juan Nepomuceno", "San Matias", "San Miguel", "San Nicolas 1st", "San Nicolas 2nd", "San Pedro", "San Rafael", "San Roque", "San Vicente", "Santa Ines", "Santa Ursula", "Santo Cristo", "Santo Niño", "Siran", "Pulungmasle"]
          },
          {
            name: "Lubao",
            barangays: ["Balantacan", "Bancal Pugad", "Bancal Sinubli", "Baruya", "Calangain", "Concepcion", "Del Carmen", "De La Paz", "Don Ignacio Dimson", "Lourdes", "Prado Siongco", "Remedios", "San Agustin", "San Antonio", "San Francisco", "San Isidro", "San Jose Apunan", "San Jose Gumi", "San Juan", "San Matias", "San Miguel", "San Nicolas 1st", "San Nicolas 2nd", "San Pedro Palcarangan", "San Pedro Saug", "San Roque Arbol", "San Roque Dau 1st", "San Roque Dau 2nd", "San Vicente", "Santa Barbara", "Santa Catalina", "Santa Cruz", "Santa Lucia", "Santa Maria", "Santa Monica", "Santa Rita", "Santa Teresa 1st", "Santa Teresa 2nd", "Santo Domingo", "Santo Niño", "Santo Tomas", "Santiago"]
          },
          {
            name: "Bacolor",
            barangays: ["Cabambangan", "Cabalantian", "Calibutbut", "Concepcion", "Dolores", "Duat", "Macabacle", "Magliman", "Maliwalu", "Mesalipit", "Parulog", "Potrero", "San Antonio", "San Isidro", "San Vicente", "Santa Barbara", "Santa Ines", "Talba", "Tinajero"]
          },
          {
            name: "Apalit",
            barangays: ["Balucuc", "Calantipe", "Cansinala", "Capalangan", "Colgante", "Paligui", "Sampaloc", "San Juan", "San Vicente", "Sucad", "Sulipan", "Tabuyuc"]
          },
          {
            name: "Arayat",
            barangays: ["Arenas", "Baliti", "Batasan", "Buensuceso", "Candating", "Cupang", "Gatiawin", "Guemasan", "La Paz", "Lacmit", "Lacolao", "Mangumbali", "Mapalad", "Panlinlang", "Paralaya", "Plazang Luma", "Poblacion", "San Agustin Norte", "San Agustin Sur", "San Antonio", "San Mateo", "San Nicolas", "San Roque Bitas", "Santo Niño Tabuan", "Suclayin", "Telapayong"]
          },
          {
            name: "Candaba",
            barangays: ["Bahay Pare", "Bambang", "Barit", "Buas", "Cuayang Bugtong", "Dalayap", "Dulong Ilog", "Lanang", "Magumbali", "Mandasig", "Mandili", "Mangumbali", "Mapalad", "Paligui", "Pangclara", "Pansinao", "Paralaya", "Pasig", "Pescadores", "Salapungan", "San Agustin", "Santo Rosario", "Tagulod", "Talang", "Tenejero", "Vizal San Pablo", "Vizal Santo Cristo", "Vizal Santo Niño"]
          },
          {
            name: "Floridablanca",
            barangays: ["Anon", "Apalit", "Basa Air Base", "Benedicto", "Bodega", "Cabangcalan", "Calibutbut", "Calapangan", "Dampe", "Fort Stotsenburg", "Gutad", "Mabical", "Maligaya", "Nabuclod", "Pabancao", "Paguiruan", "Palcarangan", "Poblacion", "San Antonio", "San Isidro", "San Jose", "San Nicolas", "San Pedro", "San Ramon", "San Roque", "Santa Monica", "Santo Rosario", "Solib", "Valdez"]
          },
          {
            name: "Macabebe",
            barangays: ["Batasan", "Caduang Tete", "Candelaria", "Castuli", "Consuelo", "Dalayap", "Mataguiti", "San Esteban", "San Francisco", "San Gabriel", "San Isidro", "San Jose", "San Juan", "San Rafael", "San Roque", "San Vicente", "Santa Cruz", "Santa Lutgarda", "Santa Maria", "Santa Rita", "Santo Niño", "Santo Rosario", "Telacsan", "Tacasan"]
          },
          {
            name: "Magalang",
            barangays: ["Ayala", "Bucanan", "Camias", "Dolores", "Escaler", "La Paz", "Navaling", "San Agustin", "San Antonio", "San Francisco", "San Ildefonso", "San Isidro", "San Jose", "San Miguel", "San Nicolas 1st", "San Nicolas 2nd", "San Pablo", "San Pedro 1st", "San Pedro 2nd", "San Roque", "San Vicente", "Santa Cruz", "Santa Lucia", "Santa Maria", "Santo Niño", "Santo Rosario", "Turu"]
          },
          {
            name: "Masantol",
            barangays: ["Alauli", "Bagang", "Balibago", "Bebe Anac", "Bebe Matua", "Bulacus", "Cambasi", "Malauli", "Nigui", "Palimpe", "Puti", "Sagrada", "San Agustin", "San Isidro Anac", "San Isidro Matua", "San Nicolas", "San Pedro", "San Rocco", "Santa Cruz", "Santa Lucia Paguiba", "Santa Lucia Wakas", "Santa Monica", "Santo Niño"]
          },
          {
            name: "Minalin",
            barangays: ["Bulac", "Dawe", "Lourdes", "Maniango", "San Francisco 1st", "San Francisco 2nd", "San Isidro", "San Nicolas", "San Pedro", "Santa Catalina", "Santa Maria", "Santa Rita", "Santo Domingo", "Santo Rosario", "Saplad"]
          },
          {
            name: "Porac",
            barangays: ["Babo Pangulo", "Babo Sacan", "Balubad", "Calzadang Bayu", "Camias", "Cangatba", "Diaz", "Dolores", "Hacienda Dolores", "Jalung", "Mancatian", "Manibaug Libutad", "Manibaug Paralaya", "Manibaug Pasig", "Manual", "Mitla Proper", "Palat", "Pias", "Pio", "Planas", "Poblacion", "Pulung Santol", "Salu", "San Jose Mitla", "Santa Cruz", "Sepung Zula", "Sinura"]
          },
          {
            name: "San Luis",
            barangays: ["San Agustin", "San Carlos", "San Isidro", "San Jose", "San Juan", "San Nicolas", "San Rocco", "San Sebastian", "Santa Catalina", "Santa Cruz Bitas", "Santa Cruz Pambilog", "Santa Lucia", "Santa Monica", "Santo Niño", "Santo Rosario", "Santo Tomas"]
          },
          {
            name: "San Simon",
            barangays: ["Concepcion", "De La Paz", "San Agustin", "San Isidro", "San Jose", "San Juan", "San Miguel", "San Nicolas", "San Pablo Libutad", "San Pablo Proper", "San Pedro", "Santa Cruz", "Santa Monica", "Santo Niño"]
          },
          {
            name: "Santa Ana",
            barangays: ["San Agustin", "San Bartolome", "San Isidro", "San Joaquin", "San Jose", "San Juan", "San Nicolas", "San Pedro", "San Rocco", "Santa Lucia", "Santa Maria", "Santo Rosario", "Santiago"]
          },
          {
            name: "Santa Rita",
            barangays: ["Becuran", "Dila-dila", "San Agustin", "San Basilio", "San Isidro", "San Jose", "San Juan", "San Matias", "San Rocco", "San Vicente", "Santa Monica"]
          },
          {
            name: "Santo Tomas",
            barangays: ["Moras De La Paz", "Poblacion", "San Bartolome", "San Matias", "San Vicente", "Santo Rosario", "Santo Niño"]
          },
          {
            name: "Sasmuan",
            barangays: ["Batang 1st", "Batang 2nd", "Mabuanbuan", "Malusac", "Sabatan", "San Antonio", "San Nicolas 1st", "San Nicolas 2nd", "San Pedro", "Santa Lucia", "Santa Monica", "Santo Tomas"]
          }
        ]
      },
      {
        name: "Bulacan",
        cities: [
          { name: "City of Malolos" },
          { name: "City of Meycauayan" },
          { name: "City of San Jose del Monte" },
          { name: "Baliwag City" },
          { name: "Bocaue" },
          { name: "Bulakan" },
          { name: "Calumpit" },
          { name: "Guiguinto" },
          { name: "Hagonoy" },
          { name: "Marilao" },
          { name: "Plaridel" },
          { name: "Pulilan" },
          { name: "San Ildefonso" },
          { name: "San Miguel" },
          { name: "San Rafael" },
          { name: "Santa Maria" }
        ]
      },
      {
        name: "Bataan",
        cities: [
          { name: "City of Balanga" },
          { name: "Dinalupihan" },
          { name: "Hermosa" },
          { name: "Mariveles" },
          { name: "Orani" },
          { name: "Orion" },
          { name: "Samal" },
          { name: "Abucay" },
          { name: "Bagac" },
          { name: "Limay" },
          { name: "Morong" },
          { name: "Pilar" }
        ]
      },
      {
        name: "Tarlac",
        cities: [
          { name: "Tarlac City" },
          { name: "Bamban" },
          { name: "Capas" },
          { name: "Concepcion" },
          { name: "Gerona" },
          { name: "Paniqui" },
          { name: "Camiling" },
          { name: "La Paz" },
          { name: "Victoria" }
        ]
      },
      {
        name: "Nueva Ecija",
        cities: [
          { name: "Cabanatuan City" },
          { name: "Gapan City" },
          { name: "Palayan City" },
          { name: "San Jose City" },
          { name: "Science City of Muñoz" },
          { name: "Guimba" },
          { name: "San Leonardo" },
          { name: "Talavera" }
        ]
      },
      {
        name: "Zambales",
        cities: [
          { name: "Olongapo City" },
          { name: "Subic" },
          { name: "Iba" },
          { name: "Castillejos" },
          { name: "San Marcelino" },
          { name: "Botolan" },
          { name: "San Antonio" },
          { name: "San Felipe" }
        ]
      },
      {
        name: "Aurora",
        cities: [
          { name: "Baler" },
          { name: "Casiguran" },
          { name: "Dingalan" },
          { name: "Maria Aurora" },
          { name: "San Luis" }
        ]
      }
    ]
  },
  {
    name: "NCR (National Capital Region)",
    code: "NCR",
    provinces: [
      {
        name: "Metro Manila",
        cities: [
          { name: "Manila" },
          { name: "Quezon City" },
          { name: "Caloocan" },
          { name: "Las Piñas" },
          { name: "Makati" },
          { name: "Malabon" },
          { name: "Mandaluyong" },
          { name: "Marikina" },
          { name: "Muntinlupa" },
          { name: "Navotas" },
          { name: "Parañaque" },
          { name: "Pasay" },
          { name: "Pasig" },
          { name: "Pateros" },
          { name: "San Juan" },
          { name: "Taguig" },
          { name: "Valenzuela" }
        ]
      }
    ]
  },
  {
    name: "Region IV-A (CALABARZON)",
    code: "REGION-IV-A",
    provinces: [
      {
        name: "Cavite",
        cities: [
          { name: "Bacoor City" },
          { name: "Cavite City" },
          { name: "Dasmariñas City" },
          { name: "General Trias City" },
          { name: "Imus City" },
          { name: "Tagaytay City" },
          { name: "Trece Martires City" },
          { name: "Silang" },
          { name: "Kawit" }
        ]
      },
      {
        name: "Laguna",
        cities: [
          { name: "Biñan City" },
          { name: "Cabuyao City" },
          { name: "Calamba City" },
          { name: "San Pablo City" },
          { name: "Santa Rosa City" },
          { name: "Los Baños" }
        ]
      },
      {
        name: "Batangas",
        cities: [
          { name: "Batangas City" },
          { name: "Lipa City" },
          { name: "Tanauan City" },
          { name: "Santo Tomas City" },
          { name: "Nasugbu" }
        ]
      },
      {
        name: "Rizal",
        cities: [
          { name: "Antipolo City" },
          { name: "Cainta" },
          { name: "Taytay" },
          { name: "Binangonan" },
          { name: "San Mateo" }
        ]
      },
      {
        name: "Quezon",
        cities: [
          { name: "Lucena City" },
          { name: "Tayabas City" },
          { name: "Candelaria" },
          { name: "Sariaya" }
        ]
      }
    ]
  },
  {
    name: "Region I (Ilocos Region)",
    code: "REGION-I",
    provinces: [
      { name: "Pangasinan", cities: [{ name: "Dagupan City" }, { name: "San Carlos City" }, { name: "Urdaneta City" }, { name: "Alaminos City" }] },
      { name: "La Union", cities: [{ name: "San Fernando City" }, { name: "Agoo" }, { name: "Bauang" }] },
      { name: "Ilocos Sur", cities: [{ name: "Vigan City" }, { name: "Candon City" }] },
      { name: "Ilocos Norte", cities: [{ name: "Laoag City" }, { name: "Batac City" }] }
    ]
  },
  {
    name: "Region II (Cagayan Valley)",
    code: "REGION-II",
    provinces: [
      { name: "Cagayan", cities: [{ name: "Tuguegarao City" }, { name: "Aparri" }] },
      { name: "Isabela", cities: [{ name: "Ilagan City" }, { name: "Santiago City" }, { name: "Cauayan City" }] },
      { name: "Nueva Vizcaya", cities: [{ name: "Bayombong" }, { name: "Solano" }] },
      { name: "Quirino", cities: [{ name: "Cabarroguis" }] }
    ]
  },
  {
    name: "CAR (Cordillera Administrative Region)",
    code: "CAR",
    provinces: [
      { name: "Benguet", cities: [{ name: "Baguio City" }, { name: "La Trinidad" }] },
      { name: "Abra", cities: [{ name: "Bangued" }] },
      { name: "Ifugao", cities: [{ name: "Lagawe" }, { name: "Banaue" }] },
      { name: "Kalinga", cities: [{ name: "Tabuk City" }] },
      { name: "Mountain Province", cities: [{ name: "Bontoc" }, { name: "Sagada" }] }
    ]
  },
  {
    name: "Region V (Bicol Region)",
    code: "REGION-V",
    provinces: [
      { name: "Albay", cities: [{ name: "Legazpi City" }] },
      { name: "Camarines Sur", cities: [{ name: "Naga City" }] },
      { name: "Sorsogon", cities: [{ name: "Sorsogon City" }] }
    ]
  },
  {
    name: "Region VI (Western Visayas)",
    code: "REGION-VI",
    provinces: [
      { name: "Iloilo", cities: [{ name: "Iloilo City" }, { name: "Passi City" }] },
      { name: "Negros Occidental", cities: [{ name: "Bacolod City" }] },
      { name: "Capiz", cities: [{ name: "Roxas City" }] },
      { name: "Aklan", cities: [{ name: "Kalibo" }, { name: "Malay (Boracay)" }] }
    ]
  },
  {
    name: "Region VII (Central Visayas)",
    code: "REGION-VII",
    provinces: [
      { name: "Cebu", cities: [{ name: "Cebu City" }, { name: "Mandaue City" }, { name: "Lapu-Lapu City" }, { name: "Talisay City" }] },
      { name: "Bohol", cities: [{ name: "Tagbilaran City" }] },
      { name: "Negros Oriental", cities: [{ name: "Dumaguete City" }] }
    ]
  },
  {
    name: "Region XI (Davao Region)",
    code: "REGION-XI",
    provinces: [
      { name: "Davao del Sur", cities: [{ name: "Davao City" }, { name: "Digos City" }] },
      { name: "Davao del Norte", cities: [{ name: "Tagum City" }, { name: "Panabo City" }] }
    ]
  }
];
