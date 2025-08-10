const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 사용자 세션 저장소 (실제로는 Redis나 DB 사용 권장)
const userSessions = new Map();

// 카카오톡 챗봇 웹훅 엔드포인트
app.post('/webhook', async (req, res) => {
    try {
        const { userRequest } = req.body;
        const userMessage = userRequest.utterance;
        const userId = userRequest.user.id;
        
        console.log('사용자 ID:', userId);
        console.log('사용자 메시지:', userMessage);
        
        // 사용자 세션 가져오기
        let userSession = userSessions.get(userId) || { step: 'welcome' };
        
        let responseMessage;
        
        // 사용자 상태에 따른 응답 처리
        if (userSession.step === 'welcome' || !userMessage || userMessage.includes('처음') || userMessage.includes('시작')) {
            responseMessage = createWelcomeMessage();
            userSession.step = 'main_category';
        } else if (userSession.step === 'main_category') {
            responseMessage = handleMainCategory(userMessage, userSession);
        } else if (userSession.step === 'sub_category') {
            responseMessage = handleSubCategory(userMessage, userSession);
        } else if (userSession.step === 'service_detail') {
            responseMessage = handleServiceDetail(userMessage, userSession);
        } else if (userSession.step === 'consultation') {
            responseMessage = handleConsultation(userMessage, userSession);
        }
        
        // 세션 저장
        userSessions.set(userId, userSession);
        
        res.json({
            version: "2.0",
            template: {
                outputs: responseMessage
            }
        });
        
    } catch (error) {
        console.error('웹훅 처리 오류:', error);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 환영 메시지 생성
function createWelcomeMessage() {
    return [
        {
            simpleText: {
                text: "안녕하세요 고객님,\n오늘은 어떤 서비스가 필요해서 찾아오셨나요?"
            }
        },
        {
            carousel: {
                type: "basicCard",
                items: [
                    {
                        title: "챗봇제작",
                        description: "카톡, 텔레그램, 웹사이트 등 다양한 플랫폼 챗봇 제작",
                        thumbnail: {
                            imageUrl: "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=챗봇제작"
                        },
                        buttons: [
                            {
                                action: "block",
                                label: "선택하기",
                                data: {
                                    category: "chatbot"
                                }
                            }
                        ]
                    },
                    {
                        title: "상페제작",
                        description: "고전환율 상품 상세페이지 제작",
                        thumbnail: {
                            imageUrl: "https://via.placeholder.com/300x200/2196F3/FFFFFF?text=상페제작"
                        },
                        buttons: [
                            {
                                action: "block",
                                label: "선택하기",
                                data: {
                                    category: "landing"
                                }
                            }
                        ]
                    },
                    {
                        title: "마케팅대행",
                        description: "블로그, 네이버, 구글 등 종합 마케팅 서비스",
                        thumbnail: {
                            imageUrl: "https://via.placeholder.com/300x200/FF9800/FFFFFF?text=마케팅대행"
                        },
                        buttons: [
                            {
                                action: "block",
                                label: "선택하기",
                                data: {
                                    category: "marketing"
                                }
                            }
                        ]
                    },
                    {
                        title: "프로그램제작",
                        description: "비즈니스 자동화 및 커스텀 프로그램 개발",
                        thumbnail: {
                            imageUrl: "https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=프로그램제작"
                        },
                        buttons: [
                            {
                                action: "block",
                                label: "선택하기",
                                data: {
                                    category: "program"
                                }
                            }
                        ]
                    },
                    {
                        title: "쇼핑몰제작",
                        description: "자동화된 결제, 재고, 배송 시스템 쇼핑몰",
                        thumbnail: {
                            imageUrl: "https://via.placeholder.com/300x200/F44336/FFFFFF?text=쇼핑몰제작"
                        },
                        buttons: [
                            {
                                action: "block",
                                label: "선택하기",
                                data: {
                                    category: "shopping"
                                }
                            }
                        ]
                    }
                ]
            }
        }
    ];
}

// 메인 카테고리 처리
function handleMainCategory(userMessage, userSession) {
    const categoryMap = {
        '챗봇제작': 'chatbot',
        '상페제작': 'landing',
        '마케팅대행': 'marketing',
        '프로그램제작': 'program',
        '쇼핑몰제작': 'shopping'
    };
    
    const selectedCategory = categoryMap[userMessage];
    
    if (!selectedCategory) {
        return [
            {
                simpleText: {
                    text: "죄송합니다. 다시 서비스를 선택해주세요."
                }
            },
            {
                basicCard: {
                    title: "서비스 다시 선택",
                    description: "원하시는 서비스를 다시 선택해주세요",
                    buttons: [
                        {
                            action: "block",
                            label: "서비스 목록 보기",
                            data: {
                                action: "restart"
                            }
                        }
                    ]
                }
            }
        ];
    }
    
    userSession.selectedCategory = selectedCategory;
    userSession.step = 'sub_category';
    
    return createSubCategoryMessage(selectedCategory);
}

// 서브 카테고리 메시지 생성
function createSubCategoryMessage(category) {
    const subCategories = {
        'chatbot': [
            { title: '카톡챗봇', description: '카카오 i Open Builder 기반 커스텀 챗봇' },
            { title: '텔레그램', description: '텔레그램 Bot API 기반 커스텀 챗봇' },
            { title: '웹사이트챗봇', description: '웹사이트 연동 실시간 상담 챗봇' },
            { title: '인스타그램챗봇', description: '인스타그램 메시징 API 기반 DM 챗봇' },
            { title: '그외챗봇', description: '기타 플랫폼 전용 커스텀 챗봇' }
        ],
        'landing': [
            { title: '상페제작', description: '상품 특성에 맞는 고전환율 상세페이지' }
        ],
        'marketing': [
            { title: '블로그마케팅', description: '네이버/티스토리 최적화 포스팅' },
            { title: '네이버마케팅', description: '네이버 검색광고, 파워링크, 브랜드' },
            { title: '구글마케팅', description: '구글 광고, 유튜브 광고 글로벌 마케팅' },
            { title: '그외마케팅', description: '채널믹스, 브랜딩 커스텀 마케팅 컨설팅' }
        ],
        'program': [
            { title: '프로그램제작', description: '비즈니스 자동화, 데이터 처리, 커스텀 프로그램' }
        ],
        'shopping': [
            { title: '쇼핑몰제작', description: '자동화된 결제, 재고, 배송 시스템 쇼핑몰' }
        ]
    };
    
    const items = subCategories[category].map((item, index) => ({
        title: item.title,
        description: item.description,
        thumbnail: {
            imageUrl: `https://via.placeholder.com/300x200/${getColorByIndex(index)}/FFFFFF?text=${encodeURIComponent(item.title)}`
        },
        buttons: [
            {
                action: "block",
                label: "선택하기",
                data: {
                    subCategory: item.title
                }
            }
        ]
    }));
    
    return [
        {
            simpleText: {
                text: `${getCategoryName(category)} 서비스를 선택하셨습니다.\n어떤 세부 서비스를 원하시나요?`
            }
        },
        {
            carousel: {
                type: "basicCard",
                items: items
            }
        }
    ];
}

// 서브 카테고리 처리
function handleSubCategory(userMessage, userSession) {
    userSession.selectedSubCategory = userMessage;
    userSession.step = 'service_detail';
    
    return createServiceDetailMessage(userSession.selectedCategory, userMessage);
}

// 서비스 상세 정보 메시지 생성
function createServiceDetailMessage(category, subCategory) {
    const serviceDetails = {
        '카톡챗봇': {
            title: '카톡챗봇 서비스',
            description: `카카오 i Open Builder를 활용한 커스텀 챗봇 제작 서비스입니다.

📱 주요 기능:
• 24시간 고객 상담 자동화
• FAQ 자동 응답 시스템
• 예약 관리 및 알림 기능
• 상품 추천 및 주문 안내
• 다국어 지원

💰 가격: 50만원 ~ 200만원
⏱️ 제작 기간: 2주 ~ 4주
🎯 활용 분야: 고객센터, 예약 시스템, 상품 안내`

        },
        '텔레그램': {
            title: '텔레그램 챗봇 서비스',
            description: `텔레그램 Bot API 기반 커스텀 챗봇 제작 서비스입니다.

📱 주요 기능:
• 텔레그램 채널 연동
• 실시간 메시지 처리
• 파일 업로드/다운로드
• 그룹 채팅 관리
• 인라인 키보드 지원

💰 가격: 30만원 ~ 150만원
⏱️ 제작 기간: 1주 ~ 3주
🎯 활용 분야: 커뮤니티 관리, 알림 서비스, 파일 공유`

        },
        '웹사이트챗봇': {
            title: '웹사이트 챗봇 서비스',
            description: `웹사이트에 연동되는 실시간 상담 챗봇 제작 서비스입니다.

📱 주요 기능:
• 웹사이트 실시간 연동
• 방문자 행동 분석
• 상품 추천 엔진
• 결제 프로세스 안내
• 모바일 최적화

💰 가격: 80만원 ~ 300만원
⏱️ 제작 기간: 3주 ~ 6주
🎯 활용 분야: 온라인 쇼핑몰, 기업 홈페이지, 서비스 안내`

        },
        '상페제작': {
            title: '상페제작 서비스',
            description: `상품 특성에 맞는 고전환율 상세페이지 제작 서비스입니다.

📱 주요 기능:
• 상품별 맞춤 디자인
• A/B 테스트 최적화
• 모바일 반응형 디자인
• SEO 최적화
• 전환율 분석 도구

💰 가격: 30만원 ~ 100만원
⏱️ 제작 기간: 1주 ~ 2주
🎯 활용 분야: 온라인 쇼핑몰, 제품 소개, 랜딩페이지`

        },
        '블로그마케팅': {
            title: '블로그 마케팅 서비스',
            description: `네이버/티스토리 최적화 포스팅 마케팅 서비스입니다.

📱 주요 기능:
• 키워드 최적화 포스팅
• 정기 콘텐츠 제작
• 백링크 구축
• 트래픽 분석
• 브랜드 노출 증대

💰 가격: 월 50만원 ~ 200만원
⏱️ 시작 기간: 즉시 시작 가능
🎯 활용 분야: 브랜드 마케팅, 제품 홍보, 고객 유치`

        }
    };
    
    const detail = serviceDetails[subCategory] || {
        title: `${subCategory} 서비스`,
        description: `${subCategory} 서비스에 대한 상세 정보입니다.\n\n자세한 내용은 상담원과 상담해주세요.`
    };
    
    return [
        {
            simpleText: {
                text: detail.description
            }
        },
        {
            basicCard: {
                title: "상담 신청",
                description: "더 자세한 상담을 원하시면 상담원과 연결해드립니다.",
                buttons: [
                    {
                        action: "block",
                        label: "상담원 연결",
                        data: {
                            action: "consultation"
                        }
                    },
                    {
                        action: "block",
                        label: "다른 서비스 보기",
                        data: {
                            action: "other_service"
                        }
                    },
                    {
                        action: "block",
                        label: "처음으로",
                        data: {
                            action: "restart"
                        }
                    }
                ]
            }
        }
    ];
}

// 서비스 상세 처리
function handleServiceDetail(userMessage, userSession) {
    if (userMessage.includes('상담원') || userMessage.includes('연결')) {
        userSession.step = 'consultation';
        return createConsultationMessage();
    } else if (userMessage.includes('다른') || userMessage.includes('서비스')) {
        userSession.step = 'sub_category';
        return createSubCategoryMessage(userSession.selectedCategory);
    } else if (userMessage.includes('처음') || userMessage.includes('시작')) {
        userSession.step = 'main_category';
        return createWelcomeMessage();
    }
    
    return [
        {
            simpleText: {
                text: "버튼을 클릭해주세요."
            }
        }
    ];
}

// 상담 연결 메시지 생성
function createConsultationMessage() {
    return [
        {
            simpleText: {
                text: `상담원 연결을 도와드리겠습니다.

📞 전화 상담: 02-1234-5678
💬 카카오톡: @zenith_service
📧 이메일: contact@zenith.com

상담 가능 시간: 평일 09:00 ~ 18:00

어떤 방법으로 상담받고 싶으신가요?`
            }
        },
        {
            basicCard: {
                title: "상담 방법 선택",
                description: "원하시는 상담 방법을 선택해주세요",
                buttons: [
                    {
                        action: "webLink",
                        label: "전화 상담",
                        webLinkUrl: "tel:0212345678"
                    },
                    {
                        action: "webLink",
                        label: "카카오톡 채널",
                        webLinkUrl: "https://pf.kakao.com/_zenith"
                    },
                    {
                        action: "webLink",
                        label: "이메일 보내기",
                        webLinkUrl: "mailto:contact@zenith.com"
                    },
                    {
                        action: "block",
                        label: "처음으로",
                        data: {
                            action: "restart"
                        }
                    }
                ]
            }
        }
    ];
}

// 상담 처리
function handleConsultation(userMessage, userSession) {
    if (userMessage.includes('처음') || userMessage.includes('시작')) {
        userSession.step = 'main_category';
        return createWelcomeMessage();
    }
    
    return [
        {
            simpleText: {
                text: "상담원이 곧 연락드리겠습니다. 감사합니다!"
            }
        }
    ];
}

// 카테고리 이름 반환
function getCategoryName(category) {
    const names = {
        'chatbot': '챗봇제작',
        'landing': '상페제작',
        'marketing': '마케팅대행',
        'program': '프로그램제작',
        'shopping': '쇼핑몰제작'
    };
    return names[category] || category;
}

// 색상 인덱스별 색상 반환
function getColorByIndex(index) {
    const colors = ['4CAF50', '2196F3', 'FF9800', '9C27B0', 'F44336', '00BCD4', '795548', '607D8B'];
    return colors[index % colors.length];
}

// 서버 시작
app.listen(PORT, () => {
    console.log(`Zenith 카카오톡 챗봇 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`웹훅 URL: http://localhost:${PORT}/webhook`);
});
