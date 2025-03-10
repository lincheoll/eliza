import {
    composeContext,
    generateMessageResponse,
    generateObject,
    HandlerCallback,
    messageCompletionFooter,
    ModelClass,
    type Action,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import axios from "axios";
import { z } from "zod";
import * as fs from "fs";

const intents = ["coin", "market-data", "trending"];

export const cryptoAction: Action = {
    name: "CRYPTO_ANALYSIS",
    similes: [
        "MARKET_ANALYSIS",
        "COIN_ANALYSIS",
        "CRYPTO_PRICE",
        "BITCOIN_PRICE",
        "ETH_PRICE",
        "SOL_PRICE",
        "ONDO_PRICE",
    ],
    description: "Analyze cryptocurrency market or specific coins",
    suppressInitialMessage: true,
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        console.log("CRYPTO_ANALYSIS");
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        try {
            const context = composeContext({
                state: currentState,
                template: analysisObjectTemplate,
            });

            const analysisObject = (await generateMessageResponse({
                runtime,
                context: context,
                modelClass: ModelClass.SMALL,
            })) as unknown as {
                type: string;
                ticker?: string;
                keywords?: string[];
                currency?: string[];
                intents?: string[];
            };

            if (analysisObject.type === "coin") {
                const results = await getRequestResults(analysisObject.ticker);
                const analysis = createCoinAnalysis(results);
                const analysisContext = composeContext({
                    state: {
                        ...state,
                        // lastMessageText: state.recentMessagesData[state.recentMessagesData.length - 1]?.content?.text,
                        jsonData: analysis,
                    },
                    template: cryptoCoinAnalysisTemplate,
                });

                console.log(analysisContext.length)
                const analysisResponse = await generateMessageResponse({
                    runtime,
                    context: analysisContext,
                    modelClass: ModelClass.LARGE,
                });

                if (callback) {
                    callback(analysisResponse);
                }
            } else {
                const results = await getRequestResults();
                const analysis = createMarketAnalysis(results);
                const analysisContext = composeContext({
                    state: {
                        ...state,
                        jsonData: analysis,
                    },
                    template: cryptoMarketAnalysisTemplate,
                });
                const analysisResponse = await generateMessageResponse({
                    runtime,
                    context: analysisContext,
                    modelClass: ModelClass.LARGE,
                });
                if (callback) {
                    callback(analysisResponse);
                }
            }
        } catch (error) {
            console.log(error);
        }

        return true;
        // const content = message.content.text.toLowerCase();

        // // 시장 분석 요청 (예: "how is crypto market today?")
        // if (content.includes("market") || content.includes("crypto")) {
        //     return {
        //         cryptoRequestType: "MARKET_ANALYSIS",
        //         ticker: ""
        //     };
        // }

        // // 특정 코인 분석 요청 (예: "is BTC bullish?", "how is Solana doing?")
        // const coins = {
        //     btc: "BTC",
        //     bitcoin: "BTC",
        //     eth: "ETH",
        //     ethereum: "ETH",
        //     sol: "SOL",
        //     solana: "SOL",
        //     // ... 다른 코인들 추가
        // };

        // for (const [keyword, symbol] of Object.entries(coins)) {
        //     if (content.includes(keyword)) {
        //         return {
        //             cryptoRequestType: "COIN_ANALYSIS",
        //             ticker: symbol
        //         };
        //     }
        // }

        // // 암호화폐 관련 질문이 아닌 경우
        // return {
        //     cryptoRequestType: "NONE",
        //     ticker: ""
        // };
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "How is the crypto market today?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me analyze the overall crypto market for you.",
                    action: "CRYPTO_ANALYSIS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Is Bitcoin bullish right now?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me check BTC's current trend.",
                    action: "CRYPTO_ANALYSIS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Is ondo finance bullish right now?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me check BTC's current trend.",
                    action: "CRYPTO_ANALYSIS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's happening in the market? Need complete analysis",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Let me check the market.",
                    action: "CRYPTO_ANALYSIS",
                },
            },
        ],
    ],
};

export const analysisObjectTemplate = `
Analyze the message to determine if it's about the cryptocurrency market or a specific coin. For ambiguous queries, use "all" or empty array. Respond in the following JSON format:

For coin-specific queries:
{
   "type": "coin",
   "ticker": "coin ticker symbol",
   "keywords": ["relevant keywords"],
   "currency": ["currency units"],
   "intents": ["price", "analysis", "news", "sentiment", "technical", "all"] or []
}

For general market queries:
{
   "type": "market",
   "keywords": ["relevant keywords"],
   "intents": ["overview", "trend", "news", "regulation", "sentiment", "all"] or []
}

Example query: "What's Bitcoin's price and technical analysis? Also any recent news about it?"
Example response:
{
   "type": "coin",
   "ticker": "BTC",
   "keywords": ["bitcoin", "price", "technical", "news"],
   "currency": ["usd"],
   "intents": ["price", "technical", "news"]
}

Example query: "Tell me everything about Bitcoin"
Example response:
{
   "type": "coin",
   "ticker": "BTC",
   "keywords": ["bitcoin"],
   "currency": ["usd"],
   "intents": ["all"]
}

Example query: "How's crypto doing?"
Example response:
{
   "type": "market",
   "keywords": ["crypto", "market"],
   "intents": []
}

Example query: "What's happening in the market? Need complete analysis"
Example response:
{
   "type": "market",
   "keywords": ["market", "analysis"],
   "intents": ["all"]
}

Recent message context:
{{recentMessages}}

Based on the conversation above, please generate an appropriate JSON object.
Note: Use "all" when the query explicitly asks for comprehensive information, and empty array [] when the query is too vague to determine specific intents.`;

export const cryptoCoinAnalysisTemplate =
    `
# Task: Analyze specific cryptocurrency performance and metrics with the latest news and market data.

# Important

# Input Data:  
coin Data: {{jsonData}}  
Latest News: {{news}}  
recent message text: {{recentMessages}}

# Direction
- Please write it in english.
- We want a range of answers. Please give similar answers, but in different forms.
- Think through and answer all questions
- recent_volume_change is not percentage. it is dollar value.
- Be community friendly, not too technical. but if the questioner wants, give a thoughtful, in-depth answer (analytics, etc...).
- Answer questions with data and news bases
- Be readable, but avoid too many line breaks.


` + messageCompletionFooter;

export const cryptoMarketAnalysisTemplate =
    `
# Task: Comprehensive Cryptocurrency Market Analysis  

# Input Data:  
Market Data: {{jsonData}}  
Latest News: {{news}}  
recent message text: {{recentMessages}}

# Direction
- Please write it in english.
- We want a range of answers. Please give similar answers, but in different forms.
- Think through and answer all questions
- recent_volume_change is not percentage. it is dollar value.
- Be community friendly, not too technical. but if the questioner wants, give a thoughtful, in-depth answer (analytics, etc...).
- Answer questions with data and news bases
- Be readable, but avoid too many line breaks.

` + messageCompletionFooter;

export const formatters = {
    // 가격 변동 상위/하위 코인 포맷터
    formatPriceMovers: (coins: any[]) => {
        return coins.map((coin) => ({
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            current_price: coin.current_price,
            price_change_24h: coin.price_change_percentage_24h.toFixed(2),
            volume_24h: coin.total_volume,
            market_cap: coin.market_cap,
            market_cap_rank: coin.market_cap_rank,
        }));
    },

    // 코인 상세 정보 포맷터
    formatCoinMarketData: (data: any) => {
        return {
            basic_info: {
                name: data.name,
                symbol: data.symbol.toUpperCase(),
                categories: data.categories,
                description: data.description?.en,
            },
            market_data: {
                current_price: data.market_data.current_price,
                price_change_24h: data.market_data.price_change_percentage_24h,
                market_cap: data.market_data.market_cap,
                market_cap_rank: data.market_cap_rank,
                total_volume: data.market_data.total_volume,
                high_24h: data.market_data.high_24h,
                low_24h: data.market_data.low_24h,
                ath: data.market_data.ath,
                ath_date: data.market_data.ath_date,
            },
            sentiment: {
                sentiment_votes_up_percentage:
                    data.sentiment_votes_up_percentage,
                sentiment_votes_down_percentage:
                    data.sentiment_votes_down_percentage,
            },
        };
    },

    // 가격 히스토리 포맷터
    formatPriceHistory: (data: any[]) => {
        return data.map(([timestamp, price]) => ({
            timestamp: new Date(timestamp).toISOString(),
            price: price,
        }));
    },

    // OHLC 데이터 포맷터
    formatOHLC: (data: any[]) => {
        return data.map(([timestamp, open, high, low, close]) => ({
            timestamp: new Date(timestamp).toISOString(),
            open,
            high,
            low,
            close,
        }));
    },

    // 글로벌 마켓 데이터 포맷터
    formatGlobalMarket: (data: any) => {

        console.log(data)
        return {
            market_cap: {
                total: data.data.total_market_cap.usd,
                change_24h: data.data.market_cap_change_percentage_24h_usd,
            },
            volume: {
                total: data.data.total_volume.usd,
            },
            dominance: {
                btc: data.data.market_cap_percentage.btc,
                eth: data.data.market_cap_percentage.eth,
            }
        };
    },

    // 트렌딩 코인 포맷터
    formatTrending: (data: any) => {
        return data.map((coin: any) => ({
            name: coin.item.name,
            symbol: coin.item.symbol.toUpperCase(),
            market_cap_rank: coin.item.market_cap_rank,
            score: coin.item.score,
            price_btc: coin.item.price_btc,
        }));
    },

    // 카테고리 데이터 포맷터 (볼륨/시가총액 변화)
    formatCategory: (category: any) => {
        return {
            name: category.name,
            market_cap: category.market_cap,
            market_cap_change_24h: category.market_cap_change_24h,
            volume_24h: category.volume_24h,
            top_3_coins_id: category.top_3_coins_id,
        };
    },
};

function formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

interface MarketAnalysisData {
    formattedGlobalMarket: any;
    formattedTopMoversSector: any[];
    formattedTopLosersSector: any[];
    formattedTrending: any[];
    formattedTopVolume: any[];
    formattedTopMarketCap: any[];
    formattedCoinData: any;
}

interface CoinAnalysisData {
    formattedCoinData: any;
    formattedPriceHistory_prices: any[];
    formattedPriceHistory_marketCaps: any[];
    formattedPriceHistory_totalVolumes: any[];
    formattedOHLC: any[];
    formattedTopVolume: any[];
}

export const createMarketAnalysis = (data: MarketAnalysisData) => {

    console.log(data.formattedGlobalMarket)
    return `
# Global Cryptocurrency Market Analysis

## Market Overview
Total Market Cap: $${formatNumber(data.formattedGlobalMarket.market_cap.total)}
24h Change: ${
        data.formattedGlobalMarket.market_cap.change_24h > 0 ? "+" : ""
    }${data.formattedGlobalMarket.market_cap.change_24h.toFixed(2)}%
Total Volume: $${formatNumber(data.formattedGlobalMarket.volume.total)}

## Market Dominance
BTC: ${data.formattedGlobalMarket.dominance.btc.toFixed(2)}%
ETH: ${data.formattedGlobalMarket.dominance.eth.toFixed(2)}%

## Bitcoin Market Status
Price: $${formatNumber(data.formattedCoinData.market_data.current_price.usd)}
24h Change: ${
        data.formattedCoinData.market_data.price_change_24h > 0 ? "+" : ""
    }${data.formattedCoinData.market_data.price_change_24h.toFixed(2)}%
24h Volume: $${formatNumber(
        data.formattedCoinData.market_data.total_volume.usd
    )}

## Market Movements
### Top Gainers Sector (24h)
${data.formattedTopMoversSector
    .map(
        (coin) =>
            `${coin.name} (${coin.symbol}): +${
                coin.price_change_24h
            }% | $${formatNumber(coin.current_price)} | Vol: $${formatNumber(
                coin.volume_24h
            )}`
    )
    .join("\n")}

### Top Losers Sector (24h)
${data.formattedTopLosersSector
    .map(
        (coin) =>
            `${coin.name} (${coin.symbol}): ${
                coin.price_change_24h
            }% | $${formatNumber(coin.current_price)} | Vol: $${formatNumber(
                coin.volume_24h
            )}`
    )
    .join("\n")}

## Trending Coins
${data.formattedTrending
    .map(
        (coin) =>
            `${coin.name} (${coin.symbol}) | Rank #${
                coin.market_cap_rank
            } | BTC: ₿${coin.price_btc.toFixed(8)}`
    )
    .join("\n")}

## Category Analysis
### Top Volume Categories
${data.formattedTopVolume
    .map(
        (cat) =>
            `${cat.name} | Volume: $${formatNumber(
                cat.volume_24h
            )} | Change: ${cat.market_cap_change_24h.toFixed(
                2
            )}% | Top Coins: ${cat.top_3_coins_id.join(", ")}`
    )
    .join("\n")}

### Top Market Cap Change Categories
${data.formattedTopMarketCap
    .map(
        (cat) =>
            `${cat.name} | Change: ${cat.market_cap_change_24h.toFixed(
                2
            )}% | Volume: $${formatNumber(
                cat.volume_24h
            )} | Top Coins: ${cat.top_3_coins_id.join(", ")}`
    )
    .join("\n")}`;
};

export const createCoinAnalysis = (data: CoinAnalysisData) => {
    return `
# Detailed Coin Analysis: ${data.formattedCoinData.basic_info.name}

## Basic Information
Name: ${data.formattedCoinData.basic_info.name} (${
        data.formattedCoinData.basic_info.symbol
    })
Categories: ${data.formattedCoinData.basic_info.categories.join(", ")}
Market Cap Rank: #${data.formattedCoinData.market_data.market_cap_rank}

## Market Data
Current Price: $${formatNumber(
        data.formattedCoinData.market_data.current_price.usd
    )}
24h Change: ${
        data.formattedCoinData.market_data.price_change_24h > 0 ? "+" : ""
    }${data.formattedCoinData.market_data.price_change_24h.toFixed(2)}%
Market Cap: $${formatNumber(data.formattedCoinData.market_data.market_cap.usd)}
24h Volume: $${formatNumber(
        data.formattedCoinData.market_data.total_volume.usd
    )}
24h High: $${formatNumber(data.formattedCoinData.market_data.high_24h.usd)}
24h Low: $${formatNumber(data.formattedCoinData.market_data.low_24h.usd)}
ATH: $${formatNumber(data.formattedCoinData.market_data.ath.usd)} (${new Date(
        data.formattedCoinData.market_data.ath_date.usd
    ).toLocaleDateString()})

## Market Sentiment
Positive Votes: ${data.formattedCoinData.sentiment.sentiment_votes_up_percentage.toFixed(
        1
    )}%
Negative Votes: ${data.formattedCoinData.sentiment.sentiment_votes_down_percentage.toFixed(
        1
    )}%


technical analysis with 30 price history data & ohlc data
## Complete Price History Data (last 30 days)
### Prices
${data.formattedPriceHistory_prices
    .map((point) => `${point.timestamp} | $${formatNumber(point.price)}`)
    .join("\n")}
### Market Caps
${data.formattedPriceHistory_marketCaps
    .map((point) => `${point.timestamp} | $${formatNumber(point.price)}`)
    .join("\n")}
### Total Volumes
${data.formattedPriceHistory_totalVolumes
    .map((point) => `${point.timestamp} | $${formatNumber(point.price)}`)
    .join("\n")}

## Complete OHLC Data (last 30 days)
${data.formattedOHLC
    .map(
        (candle) =>
            `${candle.timestamp} | O: $${formatNumber(
                candle.open
            )} | H: $${formatNumber(candle.high)} | L: $${formatNumber(
                candle.low
            )} | C: $${formatNumber(candle.close)}`
    )
    .join("\n")}

## Market Context
### Category Performance
${data.formattedTopVolume
    .filter((cat) =>
        cat.top_3_coins_id.some((coin) =>
            coin
                .toLowerCase()
                .includes(
                    data.formattedCoinData.basic_info.symbol.toLowerCase()
                )
        )
    )
    .map(
        (cat) =>
            `${cat.name} | Volume: $${formatNumber(
                cat.volume_24h
            )} | Change: ${cat.market_cap_change_24h.toFixed(2)}%`
    )
    .join("\n")}

## Coin Description
${
    data.formattedCoinData.basic_info.description || "No description available."
}`;
};

const getRequestResults = async (ticker = "BTC") => {
    const coinInfoResponse = await axios.get(
        `http://localhost:8000/coingecko/search`,
        {
            params: {
                query: ticker,
            },
        }
    );
    const coinInfo = coinInfoResponse.data;
    const coinId = coinInfo.coins[0].id;

    const trendingResponse = await axios.get(
        `http://localhost:8000/coingecko/trending`,
        {}
    );
    const trending = trendingResponse.data;

    const coinMarketDataResponse = await axios.get(
        `http://localhost:8000/coingecko/coin/${coinId}`,
        {
            params: {},
        }
    );
    const coinMarketData = coinMarketDataResponse.data;

    const coinPriceHistoryResponse = await axios.get(
        `http://localhost:8000/coingecko/coin/${coinId}/price-history`,
        {
            params: {},
        }
    );
    const coinPriceHistory = coinPriceHistoryResponse.data;

    const coinOHLCResponse = await axios.get(
        `http://localhost:8000/coingecko/coin/${coinId}/ohlc`,
        {
            params: {},
        }
    );
    const coinOHLC = coinOHLCResponse.data;

    const categoriesResponse = await axios.get(
        `http://localhost:8000/coingecko/categories`,
        {}
    );
    const categories = categoriesResponse.data;

    const sortedByVolume = categories.sort(
        (a: any, b: any) => b.volume_24h - a.volume_24h
    );
    const sortedByMarketCap = categories.sort(
        (a: any, b: any) => b.market_cap_change_24h - a.market_cap_change_24h
    );

    const topVolume = sortedByVolume.slice(0, 20);
    const topMarketCapChange = sortedByMarketCap.slice(0, 20);

    const globalMarketDataResponse = await axios.get(
        `http://localhost:8000/coingecko/global`,
        {}
    );
    const globalMarketData = globalMarketDataResponse.data;

    const marketsResponse = await axios.get(
        `http://localhost:8000/coingecko/markets`,
        {
            params: {
                vs_currency: "usd",
                order: "volume_desc",
                per_page: "250",
                sparkline: "false",
                price_change_percentage: "24h",
            },
        }
    );

    const marketsData = marketsResponse.data;
    const topMover = marketsData
        .filter((market: any) => market.price_change_percentage_24h > 0)
        .sort(
            (a: any, b: any) =>
                b.price_change_percentage_24h - a.price_change_percentage_24h
        );
    const topLoser = marketsData
        .filter((market: any) => market.price_change_percentage_24h < 0)
        .sort(
            (a: any, b: any) =>
                a.price_change_percentage_24h - b.price_change_percentage_24h
        );
    const topMoverSectorData = topMover.slice(0, 10);
    const topLoserSectorData = topLoser.slice(0, 10);


    return {
        formattedGlobalMarket: formatters.formatGlobalMarket(globalMarketData)  ,
        formattedTopMoversSector: formatters.formatPriceMovers(topMoverSectorData),
        formattedTopLosersSector: formatters.formatPriceMovers(topLoserSectorData),
        formattedTrending: formatters.formatTrending(trending),
        formattedTopVolume: topVolume.map((cat) =>
            formatters.formatCategory(cat)
        ),
        formattedTopMarketCap: topMarketCapChange.map((cat) =>
            formatters.formatCategory(cat)
        ),
        formattedCoinData: formatters.formatCoinMarketData(coinMarketData),
        formattedPriceHistory_prices: formatters.formatPriceHistory(coinPriceHistory.prices),
        formattedPriceHistory_marketCaps: formatters.formatPriceHistory(coinPriceHistory.market_caps),
        formattedPriceHistory_totalVolumes: formatters.formatPriceHistory(coinPriceHistory.total_volumes),
        formattedOHLC: formatters.formatOHLC(coinOHLC),
    };
};
