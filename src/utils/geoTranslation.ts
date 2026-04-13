/**
 * 地理位置名称中文翻译
 * 包含全球主要国家的省/州和城市名称
 */

// 美国州名
const US_STATES: Record<string, string> = {
  'Alabama': '阿拉巴马州', 'Alaska': '阿拉斯加州', 'Arizona': '亚利桑那州',
  'Arkansas': '阿肯色州', 'California': '加利福尼亚州', 'Colorado': '科罗拉多州',
  'Connecticut': '康涅狄格州', 'Delaware': '特拉华州', 'Florida': '佛罗里达州',
  'Georgia': '佐治亚州', 'Hawaii': '夏威夷州', 'Idaho': '爱达荷州',
  'Illinois': '伊利诺伊州', 'Indiana': '印第安纳州', 'Iowa': '艾奥瓦州',
  'Kansas': '堪萨斯州', 'Kentucky': '肯塔基州', 'Louisiana': '路易斯安那州',
  'Maine': '缅因州', 'Maryland': '马里兰州', 'Massachusetts': '马萨诸塞州',
  'Michigan': '密歇根州', 'Minnesota': '明尼苏达州', 'Mississippi': '密西西比州',
  'Missouri': '密苏里州', 'Montana': '蒙大拿州', 'Nebraska': '内布拉斯加州',
  'Nevada': '内华达州', 'New Hampshire': '新罕布什尔州', 'New Jersey': '新泽西州',
  'New Mexico': '新墨西哥州', 'New York': '纽约州', 'North Carolina': '北卡罗来纳州',
  'North Dakota': '北达科他州', 'Ohio': '俄亥俄州', 'Oklahoma': '俄克拉荷马州',
  'Oregon': '俄勒冈州', 'Pennsylvania': '宾夕法尼亚州', 'Rhode Island': '罗德岛州',
  'South Carolina': '南卡罗来纳州', 'South Dakota': '南达科他州', 'Tennessee': '田纳西州',
  'Texas': '得克萨斯州', 'Utah': '犹他州', 'Vermont': '佛蒙特州',
  'Virginia': '弗吉尼亚州', 'Washington': '华盛顿州', 'West Virginia': '西弗吉尼亚州',
  'Wisconsin': '威斯康星州', 'Wyoming': '怀俄明州', 'District of Columbia': '华盛顿特区'
}

// 美国主要城市
const US_CITIES: Record<string, string> = {
  'New York': '纽约', 'Los Angeles': '洛杉矶', 'Chicago': '芝加哥',
  'Houston': '休斯顿', 'Phoenix': '凤凰城', 'Philadelphia': '费城',
  'San Antonio': '圣安东尼奥', 'San Diego': '圣迭戈', 'Dallas': '达拉斯',
  'San Jose': '圣何塞', 'Austin': '奥斯汀', 'Jacksonville': '杰克逊维尔',
  'Fort Worth': '沃斯堡', 'Columbus': '哥伦布', 'Charlotte': '夏洛特',
  'San Francisco': '旧金山', 'Indianapolis': '印第安纳波利斯', 'Seattle': '西雅图',
  'Denver': '丹佛', 'Washington': '华盛顿', 'Boston': '波士顿',
  'El Paso': '埃尔帕索', 'Nashville': '纳什维尔', 'Detroit': '底特律',
  'Oklahoma City': '俄克拉荷马城', 'Portland': '波特兰', 'Las Vegas': '拉斯维加斯',
  'Memphis': '孟菲斯', 'Louisville': '路易维尔', 'Baltimore': '巴尔的摩',
  'Milwaukee': '密尔沃基', 'Albuquerque': '阿尔伯克基', 'Tucson': '图森',
  'Fresno': '弗雷斯诺', 'Mesa': '梅萨', 'Sacramento': '萨克拉门托',
  'Atlanta': '亚特兰大', 'Kansas City': '堪萨斯城', 'Colorado Springs': '科罗拉多斯普林斯',
  'Miami': '迈阿密', 'Raleigh': '罗利', 'Omaha': '奥马哈',
  'Long Beach': '长滩', 'Virginia Beach': '弗吉尼亚海滩', 'Oakland': '奥克兰',
  'Minneapolis': '明尼阿波利斯', 'Tulsa': '塔尔萨', 'Tampa': '坦帕',
  'Arlington': '阿灵顿', 'New Orleans': '新奥尔良', 'Wichita': '威奇托',
  'Cleveland': '克利夫兰', 'Bakersfield': '贝克斯菲尔德', 'Aurora': '奥罗拉',
  'Anaheim': '阿纳海姆', 'Honolulu': '檀香山', 'Santa Ana': '圣安娜',
  'Riverside': '里弗赛德', 'Corpus Christi': '科珀斯克里斯蒂', 'Lexington': '列克星敦',
  'Henderson': '亨德森', 'Stockton': '斯托克顿', 'Saint Paul': '圣保罗',
  'Cincinnati': '辛辛那提', 'St. Louis': '圣路易斯', 'Pittsburgh': '匹兹堡',
  'Greensboro': '格林斯伯勒', 'Anchorage': '安克雷奇', 'Plano': '普莱诺',
  'Lincoln': '林肯', 'Orlando': '奥兰多', 'Irvine': '尔湾',
  'Newark': '纽瓦克', 'Toledo': '托莱多', 'Durham': '达勒姆',
  'Chula Vista': '丘拉维斯塔', 'Fort Wayne': '韦恩堡', 'Jersey City': '泽西城',
  'St. Petersburg': '圣彼得斯堡', 'Laredo': '拉雷多', 'Madison': '麦迪逊',
  'Chandler': '钱德勒', 'Buffalo': '布法罗', 'Lubbock': '拉伯克',
  'Scottsdale': '斯科茨代尔', 'Reno': '里诺', 'Glendale': '格伦代尔',
  'Gilbert': '吉尔伯特', 'Winston-Salem': '温斯顿-塞勒姆', 'North Las Vegas': '北拉斯维加斯',
  'Norfolk': '诺福克', 'Chesapeake': '切萨皮克', 'Garland': '加兰',
  'Irving': '欧文', 'Hialeah': '海厄利亚', 'Fremont': '弗里蒙特',
  'Boise': '博伊西', 'Richmond': '里士满', 'Baton Rouge': '巴吞鲁日',
  'Spokane': '斯波坎', 'Des Moines': '得梅因', 'Tacoma': '塔科马',
  'San Bernardino': '圣贝纳迪诺', 'Modesto': '莫德斯托', 'Fontana': '丰塔纳',
  'Santa Clarita': '圣克拉里塔', 'Birmingham': '伯明翰', 'Oxnard': '奥克斯纳德',
  'Fayetteville': '费耶特维尔', 'Moreno Valley': '莫雷诺谷',
  'Huntington Beach': '亨廷顿海滩', 'Salt Lake City': '盐湖城',
  'Grand Rapids': '大急流城', 'Amarillo': '阿马里洛', 'Yonkers': '扬克斯',
  'Montgomery': '蒙哥马利', 'Akron': '阿克伦',
  'Little Rock': '小石城', 'Huntsville': '亨茨维尔', 'Augusta': '奥古斯塔',
  'Port St. Lucie': '圣露西港', 'Grand Prairie': '大草原城',
  'Tallahassee': '塔拉哈西', 'Overland Park': '欧弗兰帕克', 'Tempe': '坦佩',
  'McKinney': '麦金尼', 'Mobile': '莫比尔', 'Cape Coral': '开普科勒尔',
  'Shreveport': '什里夫波特', 'Frisco': '弗里斯科', 'Knoxville': '诺克斯维尔',
  'Worcester': '伍斯特', 'Brownsville': '布朗斯维尔', 'Vancouver': '温哥华',
  'Fort Lauderdale': '劳德代尔堡', 'Sioux Falls': '苏福尔斯', 'Ontario': '安大略',
  'Chattanooga': '查塔努加', 'Providence': '普罗维登斯', 'Newport News': '纽波特纽斯',
  'Rancho Cucamonga': '库卡蒙格牧场', 'Santa Rosa': '圣罗莎', 'Oceanside': '欧申赛德',
  'Salem': '塞勒姆', 'Elk Grove': '埃尔克格罗夫', 'Garden Grove': '加登格罗夫',
  'Pembroke Pines': '彭布罗克派恩斯', 'Peoria': '皮奥里亚', 'Eugene': '尤金',
  'Corona': '科罗纳', 'Cary': '卡里', 'Springfield': '斯普林菲尔德',
  'Fort Collins': '柯林斯堡', 'Jackson': '杰克逊', 'Alexandria': '亚历山大',
  'Hayward': '海沃德', 'Lancaster': '兰开斯特', 'Lakewood': '莱克伍德',
  'Clarksville': '克拉克斯维尔', 'Palmdale': '帕姆代尔', 'Salinas': '萨利纳斯',
  'Hollywood': '好莱坞',
  'Sunnyvale': '桑尼维尔', 'Macon': '梅肯',
  'Pomona': '波莫纳', 'Escondido': '埃斯孔迪多', 'Killeen': '基林',
  'Naperville': '内珀维尔', 'Joliet': '乔利埃特', 'Bellevue': '贝尔维尤',
  'Rockford': '罗克福德', 'Savannah': '萨凡纳', 'Paterson': '帕特森',
  'Torrance': '托伦斯', 'Bridgeport': '布里奇波特', 'McAllen': '麦卡伦',
  'Mesquite': '梅斯基特', 'Syracuse': '锡拉丘兹', 'Midland': '米德兰',
  'Pasadena': '帕萨迪纳', 'Murfreesboro': '默弗里斯伯勒', 'Miramar': '米拉马尔',
  'Dayton': '代顿', 'Fullerton': '富勒顿', 'Olathe': '奥拉西',
  'Orange': '奥兰治', 'Thornton': '桑顿', 'Roseville': '罗斯维尔',
  'Denton': '登顿', 'Waco': '韦科', 'Surprise': '瑟普赖斯',
  'Carrollton': '卡罗尔顿', 'West Valley City': '西瓦利城', 'Charleston': '查尔斯顿',
  'Warren': '沃伦', 'Hampton': '汉普顿', 'Gainesville': '盖恩斯维尔',
  'Visalia': '维塞利亚', 'Coral Springs': '科勒尔斯普林斯',
  'Cedar Rapids': '锡达拉皮兹', 'Sterling Heights': '斯特林海茨', 'New Haven': '纽黑文',
  'Stamford': '斯坦福', 'Concord': '康科德', 'Kent': '肯特',
  'Santa Clara': '圣克拉拉', 'Elizabeth': '伊丽莎白', 'Round Rock': '朗德罗克',
  'Athens': '雅典', 'Thousand Oaks': '千橡市', 'Lafayette': '拉斐特',
  'Simi Valley': '西米谷', 'Topeka': '托皮卡', 'Fargo': '法戈',
  'Norman': '诺曼', 'Wilmington': '威尔明顿', 'Abilene': '阿比林',
  'Odessa': '敖德萨', 'Pearland': '皮尔兰',
  'Victorville': '维克托维尔', 'Hartford': '哈特福德', 'Vallejo': '瓦列霍',
  'Allentown': '阿伦敦', 'Berkeley': '伯克利', 'Richardson': '理查森',
  'Arvada': '阿瓦达', 'Ann Arbor': '安娜堡', 'Cambridge': '剑桥',
  'Sugar Land': '舒格兰', 'Lansing': '兰辛', 'Evansville': '埃文斯维尔',
  'Independence': '独立城', 'Fairfield': '费尔菲尔德',
  'Provo': '普罗沃', 'Clearwater': '克利尔沃特', 'College Station': '大学城',
  'West Jordan': '西乔丹', 'Carlsbad': '卡尔斯巴德', 'El Monte': '艾尔蒙特',
  'Murrieta': '穆列塔', 'Temecula': '特曼库拉',
  'Palm Bay': '棕榈湾', 'Costa Mesa': '科斯塔梅萨', 'Westminster': '威斯敏斯特',
  'North Charleston': '北查尔斯顿', 'Miami Gardens': '迈阿密花园', 'Manchester': '曼彻斯特',
  'High Point': '海波因特', 'Downey': '唐尼', 'Clovis': '克洛维斯',
  'Pompano Beach': '庞帕诺海滩', 'Pueblo': '普韦布洛', 'Elgin': '埃尔金',
  'Lowell': '洛厄尔', 'Antioch': '安条克', 'West Palm Beach': '西棕榈滩',
  'Everett': '埃弗里特', 'Ventura': '文图拉',
  'Centennial': '森特尼尔', 'Lakeland': '莱克兰', 'Gresham': '格雷沙姆',
  'Billings': '比林斯', 'Inglewood': '英格尔伍德',
  'Broken Arrow': '布罗肯阿罗', 'Sandy Springs': '桑迪斯普林斯', 'Jurupa Valley': '朱鲁帕谷',
  'Hillsboro': '希尔斯伯勒', 'Waterbury': '沃特伯里', 'Santa Maria': '圣玛丽亚',
  'Boulder': '博尔德', 'Greeley': '格里利', 'Daly City': '戴利城',
  'Meridian': '梅里迪恩', 'Lewisville': '刘易斯维尔', 'Davie': '戴维',
  'West Covina': '西科维纳', 'League City': '利格城', 'Tyler': '泰勒',
  'Norwalk': '诺沃克', 'San Mateo': '圣马特奥', 'Green Bay': '绿湾',
  'Wichita Falls': '威奇托福尔斯', 'Sparks': '斯帕克斯',
  'Burbank': '伯班克', 'Rialto': '里亚尔托', 'El Cajon': '埃尔卡洪',
  'Davenport': '达文波特', 'Las Cruces': '拉斯克鲁塞斯', 'South Bend': '南本德',
  'Vista': '维斯塔', 'Renton': '伦顿', 'San Angelo': '圣安杰洛'
}

// 中国省份
const CHINA_REGIONS: Record<string, string> = {
  'Guangdong': '广东', 'Hunan': '湖南', 'Hubei': '湖北', 'Sichuan': '四川',
  'Zhejiang': '浙江', 'Jiangsu': '江苏', 'Shandong': '山东', 'Henan': '河南',
  'Hebei': '河北', 'Fujian': '福建', 'Anhui': '安徽', 'Liaoning': '辽宁',
  'Shaanxi': '陕西', 'Shanxi': '山西', 'Jiangxi': '江西', 'Yunnan': '云南',
  'Guizhou': '贵州', 'Guangxi': '广西', 'Hainan': '海南', 'Gansu': '甘肃',
  'Qinghai': '青海', 'Ningxia': '宁夏', 'Xinjiang': '新疆', 'Tibet': '西藏',
  'Inner Mongolia': '内蒙古', 'Heilongjiang': '黑龙江', 'Jilin': '吉林',
  'Beijing': '北京', 'Shanghai': '上海', 'Tianjin': '天津', 'Chongqing': '重庆',
  'Hong Kong': '香港', 'Macau': '澳门', 'Taiwan': '台湾'
}

// 中国城市
const CHINA_CITIES: Record<string, string> = {
  'Guangzhou': '广州', 'Shenzhen': '深圳', 'Dongguan': '东莞', 'Foshan': '佛山',
  'Zhuhai': '珠海', 'Zhongshan': '中山', 'Huizhou': '惠州', 'Jiangmen': '江门',
  'Shantou': '汕头', 'Zhanjiang': '湛江', 'Qingyuan': '清远', 'Shaoguan': '韶关',
  'Shanghai': '上海', 'Beijing': '北京', 'Tianjin': '天津', 'Chongqing': '重庆',
  'Hangzhou': '杭州', 'Ningbo': '宁波', 'Wenzhou': '温州', 'Jiaxing': '嘉兴',
  'Nanjing': '南京', 'Suzhou': '苏州', 'Wuxi': '无锡', 'Changzhou': '常州',
  'Chengdu': '成都', 'Wuhan': '武汉', 'Changsha': '长沙', 'Zhengzhou': '郑州',
  'Jinan': '济南', 'Qingdao': '青岛', 'Xiamen': '厦门', 'Fuzhou': '福州',
  'Hefei': '合肥', 'Nanchang': '南昌', 'Kunming': '昆明', 'Guiyang': '贵阳',
  'Nanning': '南宁', 'Haikou': '海口', 'Sanya': '三亚', 'Xian': '西安',
  'Lanzhou': '兰州', 'Xining': '西宁', 'Yinchuan': '银川', 'Urumqi': '乌鲁木齐',
  'Lhasa': '拉萨', 'Hohhot': '呼和浩特', 'Harbin': '哈尔滨', 'Changchun': '长春',
  'Shenyang': '沈阳', 'Dalian': '大连', 'Taiyuan': '太原', 'Shijiazhuang': '石家庄',
  'Zhaoqing': '肇庆', 'Maoming': '茂名', 'Yangjiang': '阳江', 'Meizhou': '梅州',
  'Jieyang': '揭阳', 'Chaozhou': '潮州', 'Shanwei': '汕尾', 'Heyuan': '河源',
  'Yunfu': '云浮', 'Zhuzhou': '株洲', 'Xiangtan': '湘潭', 'Hengyang': '衡阳',
  'Yueyang': '岳阳', 'Changde': '常德', 'Yiyang': '益阳', 'Loudi': '娄底',
  'Yongzhou': '永州', 'Huaihua': '怀化', 'Chenzhou': '郴州', 'Shaoyang': '邵阳',
  'Zhangjiajie': '张家界', 'Xiangxi': '湘西'
}

// 英国地区
const UK_REGIONS: Record<string, string> = {
  'England': '英格兰', 'Scotland': '苏格兰', 'Wales': '威尔士', 'Northern Ireland': '北爱尔兰',
  'Greater London': '大伦敦', 'West Midlands': '西米德兰兹', 'Greater Manchester': '大曼彻斯特',
  'West Yorkshire': '西约克郡', 'Kent': '肯特郡', 'Essex': '埃塞克斯郡',
  'Lancashire': '兰开夏郡', 'Hampshire': '汉普郡', 'Surrey': '萨里郡',
  'Hertfordshire': '赫特福德郡', 'South Yorkshire': '南约克郡', 'Merseyside': '默西赛德郡',
  'Norfolk': '诺福克郡', 'Suffolk': '萨福克郡', 'Devon': '德文郡',
  'Nottinghamshire': '诺丁汉郡', 'Leicestershire': '莱斯特郡', 'Derbyshire': '德比郡',
  'Staffordshire': '斯塔福德郡', 'Oxfordshire': '牛津郡', 'Cambridgeshire': '剑桥郡',
  'Berkshire': '伯克郡', 'Bristol': '布里斯托尔', 'Cornwall': '康沃尔郡',
  'Dorset': '多塞特郡', 'Somerset': '萨默塞特郡', 'Wiltshire': '威尔特郡',
  'Gloucestershire': '格洛斯特郡', 'Warwickshire': '沃里克郡', 'Worcestershire': '伍斯特郡',
  'Northamptonshire': '北安普敦郡', 'Buckinghamshire': '白金汉郡', 'Bedfordshire': '贝德福德郡',
  'Lincolnshire': '林肯郡', 'East Sussex': '东萨塞克斯郡', 'West Sussex': '西萨塞克斯郡',
  'North Yorkshire': '北约克郡', 'East Riding of Yorkshire': '东约克郡', 'Tyne and Wear': '泰恩-威尔郡',
  'Durham': '达勒姆郡', 'Northumberland': '诺森伯兰郡', 'Cumbria': '坎布里亚郡',
  'Cheshire': '柴郡', 'Shropshire': '什罗普郡', 'Herefordshire': '赫里福德郡'
}

// 英国城市
const UK_CITIES: Record<string, string> = {
  'London': '伦敦', 'Birmingham': '伯明翰', 'Manchester': '曼彻斯特', 'Leeds': '利兹',
  'Glasgow': '格拉斯哥', 'Liverpool': '利物浦', 'Newcastle': '纽卡斯尔', 'Sheffield': '谢菲尔德',
  'Bristol': '布里斯托尔', 'Edinburgh': '爱丁堡', 'Leicester': '莱斯特', 'Coventry': '考文垂',
  'Bradford': '布拉德福德', 'Cardiff': '加的夫', 'Belfast': '贝尔法斯特', 'Nottingham': '诺丁汉',
  'Kingston upon Hull': '赫尔', 'Stoke-on-Trent': '斯托克', 'Southampton': '南安普敦',
  'Derby': '德比', 'Portsmouth': '朴茨茅斯', 'Brighton': '布莱顿', 'Plymouth': '普利茅斯',
  'Wolverhampton': '伍尔弗汉普顿', 'Reading': '雷丁', 'Aberdeen': '阿伯丁', 'Dundee': '邓迪',
  'Swansea': '斯旺西', 'Milton Keynes': '米尔顿凯恩斯', 'Northampton': '北安普敦',
  'Norwich': '诺里奇', 'Luton': '卢顿', 'Swindon': '斯温顿', 'Bournemouth': '伯恩茅斯',
  'Peterborough': '彼得伯勒', 'Southend-on-Sea': '滨海绍森德', 'Sunderland': '桑德兰',
  'Warrington': '沃灵顿', 'Huddersfield': '哈德斯菲尔德', 'Slough': '斯劳',
  'Oxford': '牛津', 'Cambridge': '剑桥', 'York': '约克', 'Ipswich': '伊普斯威奇',
  'Blackpool': '布莱克浦', 'Middlesbrough': '米德尔斯堡', 'Bolton': '博尔顿',
  'Blackburn': '布莱克本', 'Newport': '纽波特', 'Preston': '普雷斯顿', 'Stockport': '斯托克波特',
  'Rotherham': '罗瑟勒姆', 'Wigan': '威根', 'Doncaster': '唐卡斯特', 'Barnsley': '巴恩斯利',
  'Oldham': '奥尔德姆', 'Rochdale': '罗奇代尔', 'Birkenhead': '伯肯黑德', 'Watford': '沃特福德',
  'Salford': '索尔福德', 'Crawley': '克劳利', 'Basildon': '巴西尔登', 'Maidstone': '梅德斯通',
  'Colchester': '科尔切斯特', 'Chelmsford': '切姆斯福德', 'Exeter': '埃克塞特',
  'Gloucester': '格洛斯特', 'Lincoln': '林肯', 'Worcester': '伍斯特', 'Bath': '巴斯',
  'Chester': '切斯特', 'Canterbury': '坎特伯雷', 'Carlisle': '卡莱尔', 'Durham': '达勒姆',
  'Inverness': '因弗内斯', 'Stirling': '斯特灵', 'Perth': '珀斯', 'St Andrews': '圣安德鲁斯'
}

// 德国地区
const DE_REGIONS: Record<string, string> = {
  'Bavaria': '巴伐利亚', 'Baden-Württemberg': '巴登-符腾堡', 'North Rhine-Westphalia': '北莱茵-威斯特法伦',
  'Lower Saxony': '下萨克森', 'Hesse': '黑森', 'Saxony': '萨克森', 'Rhineland-Palatinate': '莱茵兰-普法尔茨',
  'Berlin': '柏林', 'Schleswig-Holstein': '石勒苏益格-荷尔斯泰因', 'Brandenburg': '勃兰登堡',
  'Saxony-Anhalt': '萨克森-安哈尔特', 'Thuringia': '图林根', 'Hamburg': '汉堡',
  'Mecklenburg-Vorpommern': '梅克伦堡-前波美拉尼亚', 'Saarland': '萨尔兰', 'Bremen': '不来梅'
}

// 德国城市
const DE_CITIES: Record<string, string> = {
  'Berlin': '柏林', 'Hamburg': '汉堡', 'Munich': '慕尼黑', 'Cologne': '科隆',
  'Frankfurt': '法兰克福', 'Stuttgart': '斯图加特', 'Düsseldorf': '杜塞尔多夫', 'Dortmund': '多特蒙德',
  'Essen': '埃森', 'Leipzig': '莱比锡', 'Bremen': '不来梅', 'Dresden': '德累斯顿',
  'Hanover': '汉诺威', 'Nuremberg': '纽伦堡', 'Duisburg': '杜伊斯堡', 'Bochum': '波鸿',
  'Wuppertal': '伍珀塔尔', 'Bielefeld': '比勒费尔德', 'Bonn': '波恩', 'Münster': '明斯特',
  'Karlsruhe': '卡尔斯鲁厄', 'Mannheim': '曼海姆', 'Augsburg': '奥格斯堡', 'Wiesbaden': '威斯巴登',
  'Gelsenkirchen': '盖尔森基兴', 'Mönchengladbach': '门兴格拉德巴赫', 'Braunschweig': '不伦瑞克',
  'Chemnitz': '开姆尼茨', 'Kiel': '基尔', 'Aachen': '亚琛', 'Halle': '哈雷',
  'Magdeburg': '马格德堡', 'Freiburg': '弗莱堡', 'Krefeld': '克雷费尔德', 'Lübeck': '吕贝克',
  'Oberhausen': '奥伯豪森', 'Erfurt': '爱尔福特', 'Mainz': '美因茨', 'Rostock': '罗斯托克',
  'Kassel': '卡塞尔', 'Hagen': '哈根', 'Hamm': '哈姆', 'Saarbrücken': '萨尔布吕肯',
  'Mülheim': '米尔海姆', 'Potsdam': '波茨坦', 'Ludwigshafen': '路德维希港', 'Oldenburg': '奥尔登堡',
  'Leverkusen': '勒沃库森', 'Osnabrück': '奥斯纳布吕克', 'Solingen': '索林根', 'Heidelberg': '海德堡',
  'Herne': '黑尔讷', 'Neuss': '诺伊斯', 'Darmstadt': '达姆施塔特', 'Paderborn': '帕德博恩',
  'Regensburg': '雷根斯堡', 'Ingolstadt': '因戈尔施塔特', 'Würzburg': '维尔茨堡', 'Wolfsburg': '沃尔夫斯堡',
  'Ulm': '乌尔姆', 'Heilbronn': '海尔布隆', 'Pforzheim': '普福尔茨海姆', 'Göttingen': '哥廷根',
  'Bottrop': '博特罗普', 'Trier': '特里尔', 'Recklinghausen': '雷克林豪森', 'Reutlingen': '罗伊特林根',
  'Bremerhaven': '不来梅港', 'Koblenz': '科布伦茨', 'Bergisch Gladbach': '贝尔吉施格拉德巴赫',
  'Jena': '耶拿', 'Remscheid': '雷姆沙伊德', 'Erlangen': '埃尔朗根', 'Moers': '默尔斯',
  'Siegen': '锡根', 'Hildesheim': '希尔德斯海姆', 'Salzgitter': '萨尔茨吉特'
}

// 法国地区
const FR_REGIONS: Record<string, string> = {
  'Île-de-France': '法兰西岛', 'Auvergne-Rhône-Alpes': '奥弗涅-罗讷-阿尔卑斯',
  'Nouvelle-Aquitaine': '新阿基坦', 'Occitanie': '奥克西塔尼', 'Hauts-de-France': '上法兰西',
  'Provence-Alpes-Côte d\'Azur': '普罗旺斯-阿尔卑斯-蓝色海岸', 'Grand Est': '大东部',
  'Pays de la Loire': '卢瓦尔河地区', 'Bretagne': '布列塔尼', 'Normandie': '诺曼底',
  'Bourgogne-Franche-Comté': '勃艮第-弗朗什-孔泰', 'Centre-Val de Loire': '中央-卢瓦尔河谷',
  'Corse': '科西嘉'
}

// 法国城市
const FR_CITIES: Record<string, string> = {
  'Paris': '巴黎', 'Marseille': '马赛', 'Lyon': '里昂', 'Toulouse': '图卢兹',
  'Nice': '尼斯', 'Nantes': '南特', 'Strasbourg': '斯特拉斯堡', 'Montpellier': '蒙彼利埃',
  'Bordeaux': '波尔多', 'Lille': '里尔', 'Rennes': '雷恩', 'Reims': '兰斯',
  'Le Havre': '勒阿弗尔', 'Saint-Étienne': '圣艾蒂安', 'Toulon': '土伦', 'Grenoble': '格勒诺布尔',
  'Dijon': '第戎', 'Angers': '昂热', 'Nîmes': '尼姆', 'Villeurbanne': '维勒班',
  'Saint-Denis': '圣但尼', 'Le Mans': '勒芒', 'Aix-en-Provence': '艾克斯',
  'Clermont-Ferrand': '克莱蒙费朗', 'Brest': '布雷斯特', 'Tours': '图尔', 'Limoges': '利摩日',
  'Amiens': '亚眠', 'Perpignan': '佩皮尼昂', 'Metz': '梅斯', 'Besançon': '贝桑松',
  'Orléans': '奥尔良', 'Rouen': '鲁昂', 'Mulhouse': '米卢斯', 'Caen': '卡昂',
  'Nancy': '南锡', 'Saint-Paul': '圣保罗', 'Argenteuil': '阿让特伊', 'Montreuil': '蒙特勒伊',
  'Roubaix': '鲁贝', 'Dunkerque': '敦刻尔克', 'Tourcoing': '图尔宽', 'Avignon': '阿维尼翁',
  'Nanterre': '南泰尔', 'Créteil': '克雷泰伊', 'Poitiers': '普瓦捷', 'Fort-de-France': '法兰西堡',
  'Versailles': '凡尔赛', 'Courbevoie': '库尔布瓦', 'Vitry-sur-Seine': '塞纳河畔维特里',
  'Colombes': '科隆布', 'Pau': '波城', 'Aulnay-sous-Bois': '欧奈苏布瓦', 'Asnières-sur-Seine': '塞纳河畔阿涅尔',
  'Rueil-Malmaison': '吕埃马尔迈松', 'Saint-Pierre': '圣皮埃尔', 'Antibes': '昂蒂布',
  'Saint-Maur-des-Fossés': '圣莫代福塞', 'Champigny-sur-Marne': '马恩河畔尚皮尼', 'La Rochelle': '拉罗谢尔',
  'Aubervilliers': '欧贝维利耶', 'Calais': '加来', 'Cannes': '戛纳', 'Le Tampon': '勒唐蓬',
  'Béziers': '贝济耶', 'Colmar': '科尔马', 'Bourges': '布尔日', 'Mérignac': '梅里尼亚克',
  'Saint-Nazaire': '圣纳泽尔', 'Drancy': '德朗西', 'Ajaccio': '阿雅克肖', 'Issy-les-Moulineaux': '伊西莱穆利诺',
  'Noisy-le-Grand': '大努瓦西', 'Levallois-Perret': '勒瓦卢瓦佩雷', 'Quimper': '坎佩尔',
  'Troyes': '特鲁瓦', 'Neuilly-sur-Seine': '塞纳河畔讷伊', 'Antony': '安东尼', 'Sarcelles': '萨塞勒',
  'Pessac': '佩萨克', 'Vénissieux': '韦尼雪', 'Clichy': '克利希', 'Ivry-sur-Seine': '塞纳河畔伊夫里',
  'Chambéry': '尚贝里', 'Lorient': '洛里昂', 'Les Abymes': '阿比姆', 'Montauban': '蒙托邦',
  'Niort': '尼奥尔', 'Sète': '塞特', 'Villejuif': '维勒瑞夫', 'Hyères': '耶尔',
  'Saint-Quentin': '圣康坦', 'Beauvais': '博韦', 'Épinay-sur-Seine': '塞纳河畔埃皮奈'
}

// 日本地区
const JP_REGIONS: Record<string, string> = {
  'Tokyo': '东京都', 'Osaka': '大阪府', 'Kanagawa': '神奈川县', 'Aichi': '爱知县',
  'Saitama': '�的玉县', 'Chiba': '千叶县', 'Hyogo': '�的库县', 'Hokkaido': '北海道',
  'Fukuoka': '福冈县', 'Shizuoka': '静冈县', 'Hiroshima': '广岛县', 'Kyoto': '京都府',
  'Ibaraki': '茨城县', 'Niigata': '新潟县', 'Miyagi': '宫城县', 'Nagano': '长野县',
  'Gifu': '岐阜县', 'Gunma': '群马县', 'Tochigi': '栃木县', 'Okayama': '冈山县',
  'Mie': '三重县', 'Fukushima': '福岛县', 'Kumamoto': '熊本县', 'Kagoshima': '�的�的岛县',
  'Okinawa': '冲绳县', 'Shiga': '滋贺县', 'Yamaguchi': '山口县', 'Ehime': '爱媛县',
  'Nara': '奈良县', 'Nagasaki': '长崎县', 'Aomori': '青森县', 'Iwate': '岩手县',
  'Oita': '大分县', 'Ishikawa': '石川县', 'Yamagata': '山形县', 'Miyazaki': '宫崎县',
  'Toyama': '富山县', 'Akita': '秋田县', 'Wakayama': '和歌山县', 'Kagawa': '香川县',
  'Saga': '佐贺县', 'Yamanashi': '山梨县', 'Fukui': '福井县', 'Tokushima': '德岛县',
  'Kochi': '高知县', 'Shimane': '岛根县', 'Tottori': '鳥取县'
}

// 日本城市
const JP_CITIES: Record<string, string> = {
  'Tokyo': '东京', 'Yokohama': '横滨', 'Osaka': '大阪', 'Nagoya': '名古屋',
  'Sapporo': '札幌', 'Fukuoka': '福冈', 'Kobe': '神户', 'Kawasaki': '川崎',
  'Kyoto': '京都', 'Saitama': '埼玉', 'Hiroshima': '广岛', 'Sendai': '仙台',
  'Kitakyushu': '北九州', 'Chiba': '千叶', 'Sakai': '堺', 'Niigata': '新潟',
  'Hamamatsu': '滨松', 'Shizuoka': '静冈', 'Sagamihara': '相模原', 'Okayama': '冈山',
  'Kumamoto': '熊本', 'Hachioji': '八王子', 'Kagoshima': '鹿儿岛', 'Funabashi': '船桥',
  'Kawaguchi': '川口', 'Himeji': '�的路', 'Matsuyama': '松山', 'Higashiosaka': '东大阪',
  'Utsunomiya': '宇都宫', 'Matsudo': '松户', 'Nishinomiya': '西宫', 'Ichikawa': '市川',
  'Kurashiki': '仓敷', 'Amagasaki': '尼崎', 'Kanazawa': '金�的', 'Nagasaki': '长崎',
  'Oita': '大分', 'Yokosuka': '横须贺', 'Gifu': '岐阜', 'Hirakata': '�的方',
  'Machida': '町田', 'Toyota': '丰田', 'Fujisawa': '藤泽', 'Kashiwa': '柏',
  'Takamatsu': '高松', 'Toyonaka': '丰中', 'Nagano': '长野', 'Toyohashi': '丰桥',
  'Ichinomiya': '一宫', 'Wakayama': '和歌山', 'Okazaki': '冈崎', 'Nara': '奈良',
  'Takatsuki': '高槻', 'Asahikawa': '�的川', 'Iwaki': '磐城', 'Koriyama': '�的山',
  'Tokorozawa': '所泽', 'Kawagoe': '川越', 'Kochi': '高知', 'Kasugai': '春日井',
  'Akita': '秋田', 'Aomori': '青森', 'Koshigaya': '越谷', 'Miyazaki': '宫崎',
  'Naha': '那霸', 'Suita': '吹田', 'Fukuyama': '福山', 'Maebashi': '前桥',
  'Takasaki': '高崎', 'Morioka': '盛冈', 'Otsu': '大津', 'Akashi': '明石',
  'Nagaoka': '长冈', 'Yokkaichi': '四日市', 'Fukui': '福井', 'Tokushima': '德岛',
  'Tottori': '鸟取', 'Matsue': '松江', 'Yamagata': '山形', 'Tsukuba': '筑波',
  'Sasebo': '佐世保', 'Hakodate': '函馆', 'Shimonoseki': '下关', 'Saga': '佐贺'
}

// 韩国地区
const KR_REGIONS: Record<string, string> = {
  'Seoul': '首尔', 'Busan': '釜山', 'Incheon': '仁川', 'Daegu': '大邱',
  'Daejeon': '大田', 'Gwangju': '光州', 'Ulsan': '蔚山', 'Sejong': '世宗',
  'Gyeonggi-do': '京畿道', 'Gangwon-do': '江原道', 'North Chungcheong': '忠清北道',
  'South Chungcheong': '忠清南道', 'North Jeolla': '全罗北道', 'South Jeolla': '全罗南道',
  'North Gyeongsang': '庆尚北道', 'South Gyeongsang': '庆尚南道', 'Jeju': '济州'
}

// 韩国城市
const KR_CITIES: Record<string, string> = {
  'Seoul': '首尔', 'Busan': '釜山', 'Incheon': '仁川', 'Daegu': '大邱',
  'Daejeon': '大田', 'Gwangju': '光州', 'Ulsan': '蔚山', 'Suwon': '水原',
  'Seongnam': '城南', 'Goyang': '高阳', 'Yongin': '龙仁', 'Bucheon': '富川',
  'Ansan': '安山', 'Anyang': '安养', 'Namyangju': '南杨州', 'Hwaseong': '华城',
  'Cheongju': '清州', 'Jeonju': '全州', 'Cheonan': '天安', 'Gimhae': '金海',
  'Changwon': '昌原', 'Pohang': '浦项', 'Jeju': '济州', 'Pyeongtaek': '平泽',
  'Siheung': '始兴', 'Paju': '坡州', 'Gimpo': '金浦', 'Uijeongbu': '议政府',
  'Gwangmyeong': '光明', 'Wonju': '原州', 'Iksan': '益山', 'Asan': '牙山',
  'Gumi': '龟尾', 'Yangsan': '梁山', 'Jinju': '晋州', 'Chuncheon': '春川',
  'Gunsan': '群山', 'Mokpo': '木浦', 'Yeosu': '丽水', 'Suncheon': '顺天',
  'Gyeongju': '庆州', 'Geoje': '巨济', 'Gangneung': '江陵', 'Tongyeong': '统营'
}

// 俄罗斯地区
const RU_REGIONS: Record<string, string> = {
  'Moscow': '莫斯科', 'Saint Petersburg': '圣彼得堡', 'Moscow Oblast': '莫斯科州',
  'Krasnodar Krai': '克拉斯诺达尔边疆区', 'Sverdlovsk Oblast': '斯维尔德洛夫斯克州',
  'Rostov Oblast': '罗斯托夫州', 'Tatarstan': '鞑靼斯坦', 'Bashkortostan': '巴什科尔托斯坦',
  'Chelyabinsk Oblast': '车里雅宾斯克州', 'Nizhny Novgorod Oblast': '下诺夫哥罗德州',
  'Samara Oblast': '萨马拉州', 'Novosibirsk Oblast': '新西伯利亚州',
  'Leningrad Oblast': '列宁格勒州', 'Krasnoyarsk Krai': '克拉斯诺亚尔斯克边疆区',
  'Perm Krai': '彼尔姆边疆区', 'Volgograd Oblast': '伏尔加格勒州',
  'Voronezh Oblast': '沃罗涅日州', 'Saratov Oblast': '萨拉托夫州',
  'Irkutsk Oblast': '伊尔库茨克州', 'Kemerovo Oblast': '克麦罗沃州'
}

// 俄罗斯城市
const RU_CITIES: Record<string, string> = {
  'Moscow': '莫斯科', 'Saint Petersburg': '圣彼得堡', 'Novosibirsk': '新西伯利亚',
  'Yekaterinburg': '叶卡捷琳堡', 'Kazan': '喀山', 'Nizhny Novgorod': '下诺夫哥罗德',
  'Chelyabinsk': '车里雅宾斯克', 'Samara': '萨马拉', 'Omsk': '鄂木斯克',
  'Rostov-on-Don': '顿河畔罗斯托夫', 'Ufa': '乌法', 'Krasnoyarsk': '克拉斯诺亚尔斯克',
  'Voronezh': '沃罗涅日', 'Perm': '彼尔姆', 'Volgograd': '伏尔加格勒',
  'Krasnodar': '克拉斯诺达尔', 'Saratov': '萨拉托夫', 'Tyumen': '秋明',
  'Tolyatti': '陶里亚蒂', 'Izhevsk': '伊热夫斯克', 'Barnaul': '巴尔瑙尔',
  'Ulyanovsk': '乌里扬诺夫斯克', 'Irkutsk': '伊尔库茨克', 'Khabarovsk': '哈巴罗夫斯克',
  'Yaroslavl': '雅罗斯拉夫尔', 'Vladivostok': '符拉迪沃斯托克', 'Makhachkala': '马哈奇卡拉',
  'Tomsk': '托木斯克', 'Orenburg': '奥伦堡', 'Kemerovo': '克麦罗沃',
  'Novokuznetsk': '新库兹涅茨克', 'Ryazan': '梁赞', 'Astrakhan': '阿斯特拉罕',
  'Naberezhnye Chelny': '下卡姆斯克', 'Penza': '奔萨', 'Lipetsk': '利佩茨克',
  'Kirov': '基洛夫', 'Cheboksary': '切博克萨雷', 'Tula': '图拉',
  'Kaliningrad': '加里宁格勒', 'Balashikha': '巴拉希哈', 'Kursk': '库尔斯克',
  'Sochi': '索契', 'Stavropol': '斯塔夫罗波尔', 'Ulan-Ude': '乌兰乌德',
  'Tver': '特维尔', 'Magnitogorsk': '马格尼托哥尔斯克', 'Ivanovo': '伊万诺沃',
  'Bryansk': '布良斯克', 'Belgorod': '别尔哥罗德', 'Surgut': '苏尔古特',
  'Vladimir': '弗拉基米尔', 'Nizhny Tagil': '下塔吉尔', 'Arkhangelsk': '阿尔汉格尔斯克',
  'Chita': '赤塔', 'Kaluga': '卡卢加', 'Smolensk': '斯摩棱斯克',
  'Volzhsky': '伏尔日斯基', 'Kurgan': '库尔干', 'Cherepovets': '切列波韦茨',
  'Oryol': '奥廖尔', 'Saransk': '萨兰斯克', 'Vologda': '沃洛格达',
  'Yakutsk': '雅库茨克', 'Vladikavkaz': '弗拉季高加索', 'Murmansk': '摩尔曼斯克'
}

// 其他国家主要城市
const OTHER_CITIES: Record<string, string> = {
  // 加拿大
  'Toronto': '多伦多', 'Montreal': '蒙特利尔', 'Vancouver': '温哥华', 'Calgary': '卡尔加里',
  'Edmonton': '埃德蒙顿', 'Ottawa': '渥太华', 'Winnipeg': '温尼伯', 'Quebec City': '魁北克城',
  'Hamilton': '汉密尔顿', 'Kitchener': '基奇纳', 'London': '伦敦', 'Victoria': '维多利亚',
  'Halifax': '哈利法克斯', 'Oshawa': '奥沙瓦', 'Windsor': '温莎', 'Saskatoon': '萨斯卡通',
  'Regina': '里贾纳', 'St. John\'s': '圣约翰斯', 'Barrie': '巴里', 'Kelowna': '基洛纳',
  // 澳大利亚
  'Sydney': '悉尼', 'Melbourne': '墨尔本', 'Brisbane': '布里斯班', 'Perth': '珀斯',
  'Adelaide': '阿德莱德', 'Gold Coast': '黄金海岸', 'Canberra': '堪培拉', 'Newcastle': '纽卡斯尔',
  'Wollongong': '卧龙岗', 'Hobart': '霍巴特', 'Geelong': '吉朗', 'Townsville': '汤斯维尔',
  'Cairns': '凯恩斯', 'Darwin': '达尔文', 'Toowoomba': '图文巴', 'Ballarat': '巴拉瑞特',
  // 意大利
  'Rome': '罗马', 'Milan': '米兰', 'Naples': '那不勒斯', 'Turin': '都灵',
  'Palermo': '巴勒莫', 'Genoa': '热那亚', 'Bologna': '博洛尼亚', 'Florence': '佛罗伦萨',
  'Bari': '巴里', 'Catania': '卡塔尼亚', 'Venice': '威尼斯', 'Verona': '维罗纳',
  'Messina': '墨西拿', 'Padua': '帕多瓦', 'Trieste': '的里雅斯特', 'Brescia': '布雷西亚',
  'Parma': '帕尔马', 'Taranto': '塔兰托', 'Prato': '普拉托', 'Modena': '摩德纳',
  // 西班牙
  'Madrid': '马德里', 'Barcelona': '巴塞罗那', 'Valencia': '瓦伦西亚', 'Seville': '塞维利亚',
  'Zaragoza': '萨拉戈萨', 'Málaga': '马拉加', 'Murcia': '穆尔西亚', 'Palma': '帕尔马',
  'Las Palmas': '拉斯帕尔马斯', 'Bilbao': '毕尔巴鄂', 'Alicante': '阿利坎特', 'Córdoba': '科尔多瓦',
  'Valladolid': '巴利亚多利德', 'Vigo': '维戈', 'Gijón': '希洪', 'Granada': '格拉纳达',
  // 荷兰
  'Amsterdam': '阿姆斯特丹', 'Rotterdam': '鹿特丹', 'The Hague': '海牙', 'Utrecht': '乌得勒支',
  'Eindhoven': '埃因霍温', 'Tilburg': '蒂尔堡', 'Groningen': '格罗宁根', 'Almere': '阿尔梅勒',
  'Breda': '布雷达', 'Nijmegen': '奈梅亨', 'Enschede': '恩斯赫德', 'Haarlem': '哈勒姆',
  // 瑞士
  'Zurich': '苏黎世', 'Geneva': '日内瓦', 'Basel': '巴塞尔', 'Lausanne': '洛桑',
  'Bern': '伯尔尼', 'Winterthur': '温特图尔', 'Lucerne': '卢塞恩', 'St. Gallen': '圣加仑',
  // 瑞典
  'Stockholm': '斯德哥尔摩', 'Gothenburg': '哥德堡', 'Malmö': '马尔默', 'Uppsala': '乌普萨拉',
  'Västerås': '韦斯特罗斯', 'Örebro': '厄勒布鲁', 'Linköping': '林雪平', 'Helsingborg': '赫尔辛堡',
  // 挪威
  'Oslo': '奥斯陆', 'Bergen': '卑尔根', 'Trondheim': '特隆赫姆', 'Stavanger': '斯塔万格',
  // 丹麦
  'Copenhagen': '哥本哈根', 'Aarhus': '奥胡斯', 'Odense': '欧登塞', 'Aalborg': '奥尔堡',
  // 芬兰
  'Helsinki': '赫尔辛基', 'Espoo': '埃斯波', 'Tampere': '坦佩雷', 'Vantaa': '万塔', 'Oulu': '奥卢',
  // 波兰
  'Warsaw': '华沙', 'Kraków': '克拉科夫', 'Łódź': '罗兹', 'Wrocław': '弗罗茨瓦夫',
  'Poznań': '波兹南', 'Gdańsk': '格但斯克', 'Szczecin': '什切青', 'Bydgoszcz': '比得哥什',
  'Lublin': '卢布林', 'Katowice': '卡托维兹', 'Białystok': '比亚韦斯托克', 'Gdynia': '格丁尼亚',
  // 土耳其
  'Istanbul': '伊斯坦布尔', 'Ankara': '安卡拉', 'Izmir': '伊兹密尔', 'Bursa': '布尔萨',
  'Antalya': '安塔利亚', 'Adana': '阿达纳', 'Konya': '科尼亚', 'Gaziantep': '加济安泰普',
  // 印度
  'Mumbai': '孟买', 'Delhi': '德里', 'Bangalore': '班加罗尔', 'Hyderabad': '海得拉巴',
  'Chennai': '金奈', 'Kolkata': '加尔各答', 'Ahmedabad': '艾哈迈达巴德', 'Pune': '浦那',
  'Surat': '苏拉特', 'Jaipur': '斋浦尔', 'Lucknow': '勒克瑙', 'Kanpur': '坎普尔',
  // 巴西
  'São Paulo': '圣保罗', 'Rio de Janeiro': '里约热内卢', 'Brasília': '巴西利亚',
  'Salvador': '萨尔瓦多', 'Fortaleza': '福塔莱萨', 'Belo Horizonte': '贝洛奥里藏特',
  'Manaus': '马瑙斯', 'Curitiba': '库里蒂巴', 'Recife': '累西腓', 'Porto Alegre': '阿雷格里港',
  // 墨西哥
  'Mexico City': '墨西哥城', 'Guadalajara': '瓜达拉哈拉', 'Monterrey': '蒙特雷',
  'Puebla': '普埃布拉', 'Tijuana': '蒂华纳', 'León': '莱昂', 'Juárez': '华雷斯',
  'Zapopan': '萨波潘', 'Mérida': '梅里达', 'Cancún': '坎昆',
  // 东南亚
  'Singapore': '新加坡', 'Bangkok': '曼谷', 'Ho Chi Minh City': '胡志明市', 'Hanoi': '河内',
  'Jakarta': '雅加达', 'Kuala Lumpur': '吉隆坡', 'Manila': '马尼拉', 'Cebu': '宿务',
  'Phuket': '普吉', 'Bali': '巴厘岛', 'Chiang Mai': '清迈', 'Penang': '槟城'
}

// 其他国家地区
const OTHER_REGIONS: Record<string, string> = {
  // 加拿大
  'Ontario': '安大略省', 'Quebec': '魁北克省', 'British Columbia': '不列颠哥伦比亚省',
  'Alberta': '艾伯塔省', 'Manitoba': '曼尼托巴省', 'Saskatchewan': '萨斯喀彻温省',
  'Nova Scotia': '新斯科舍省', 'New Brunswick': '新不伦瑞克省', 'Newfoundland and Labrador': '纽芬兰与拉布拉多省',
  'Prince Edward Island': '爱德华王子岛省', 'Northwest Territories': '西北地区', 'Yukon': '育空地区', 'Nunavut': '努纳武特地区',
  // 澳大利亚
  'New South Wales': '新南威尔士州', 'Victoria': '维多利亚州', 'Queensland': '昆士兰州',
  'Western Australia': '西澳大利亚州', 'South Australia': '南澳大利亚州', 'Tasmania': '塔斯马尼亚州',
  'Northern Territory': '北领地', 'Australian Capital Territory': '澳大利亚首都领地'
}

// 合并所有地区映射
const ALL_REGIONS: Record<string, string> = {
  ...US_STATES,
  ...CHINA_REGIONS,
  ...UK_REGIONS,
  ...DE_REGIONS,
  ...FR_REGIONS,
  ...JP_REGIONS,
  ...KR_REGIONS,
  ...RU_REGIONS,
  ...OTHER_REGIONS
}

// 合并所有城市映射
const ALL_CITIES: Record<string, string> = {
  ...US_CITIES,
  ...CHINA_CITIES,
  ...UK_CITIES,
  ...DE_CITIES,
  ...FR_CITIES,
  ...JP_CITIES,
  ...KR_CITIES,
  ...RU_CITIES,
  ...OTHER_CITIES
}

/**
 * 翻译地区名称
 */
export function translateRegion(name: string): string {
  if (!name) {return '未知'}
  return ALL_REGIONS[name] || name
}

/**
 * 翻译城市名称
 */
export function translateCity(name: string): string {
  if (!name) {return '未知'}
  return ALL_CITIES[name] || name
}

/**
 * 翻译地理位置名称（自动判断是地区还是城市）
 */
export function translateGeoName(name: string): string {
  if (!name) {return '未知'}
  // 优先查找地区，再查找城市
  return ALL_REGIONS[name] || ALL_CITIES[name] || name
}
