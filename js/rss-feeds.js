const RSS_CONFIG = {
    // Különböző RSS proxy-k (ha egyik nem működik, másik próba)
    proxies: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
    ],

    // CSAK 100% sport RSS feedek
    feeds: [
        // Nemzeti Sport - 100% sport (legmegbízhatóbb)
        { url: 'https://www.nemzetisport.hu/rss', category: 'Sport', name: 'Nemzeti Sport' },

        // Nemzeti Sport Foci
        { url: 'https://www.nemzetisport.hu/rss/labdarugas', category: 'Foci', name: 'NSO Foci' },

        // Nemzeti Sport egyéni sportok
        { url: 'https://www.nemzetisport.hu/rss/egyeni-sportok', category: 'Sport', name: 'NSO Egyéni' },

        // Index Sport
        { url: 'https://index.hu/sport/rss', category: 'Sport', name: 'Index Sport' }
    ],

    // Sport kulcsszavak - legalább egynek szerepelnie kell
    sportKeywords: [
        // Focis szavak
        'foci', 'futball', 'labdarúg', 'gólt', 'gól', 'meccs', 'bajnok', 'liga', 'csapat',
        'edző', 'játékos', 'focist', 'kapus', 'hátvéd', 'csatár', 'középpályás',
        // Egyéb sportok
        'tenisz', 'kosár', 'kézilabda', 'vízilabda', 'úszó', 'atlét', 'sí', 'hokkey', 'jégkorong',
        'kerékpár', 'birkóz', 'box', 'vívás', 'torna', 'evezés', 'kajak', 'kenu',
        // Események
        'olimpia', 'vb', 'eb', 'döntő', 'elődöntő', 'negyeddöntő', 'selejtező', 'playoff',
        // F1 motorsport
        'f1', 'forma-1', 'verstappen', 'hamilton', 'leclerc', 'nagydíj',
        // Amerikai sportok
        'nba', 'nfl', 'nhl', 'mlb',
        // Klubok
        'real madrid', 'barcelona', 'manchester', 'liverpool', 'chelsea', 'arsenal', 'juventus', 'bayern',
        'fradi', 'ferencváros', 'honvéd', 'újpest', 'fehérvár', 'debrecen', 'puskás akadémia',
        // Sztárok
        'messi', 'ronaldo', 'mbappé', 'haaland', 'szoboszlai', 'gulácsi', 'willi orbán',
        // Általános sport szavak
        'sport', 'győz', 'vereség', 'győzelem', 'pont', 'tabella', 'forduló', 'mérkőzés',
        'válogatott', 'átigazol', 'igazol', 'leigazol', 'szerződés'
    ],

    // KIZÁRT kulcsszavak - ha bármelyik szerepel, a cikk KIZÁRVA
    excludedKeywords: [
        'politika', 'kormány', 'miniszter', 'választás', 'parlament', 'orbán viktor',
        'drogállam', 'drog', 'bűnöz', 'gyilkos', 'rendőr', 'letartóztatta',
        'háború', 'bomba', 'támadás', 'terrori', 'katonai',
        'gazdaság', 'infláció', 'tőzsde', 'bitcoin', 'kripto',
        'celebrit', 'sztár', 'vacsora', 'divat', 'beauty',
        'időjárás', 'vihar', 'árvíz', 'földrengés',
        'netflex', 'sorozat', 'film', 'mozi', 'zene', 'koncert',
        'trump', 'biden', 'putin', 'fehér ház', 'kreml'
    ],

    // Frissítési időköz
    refreshInterval: 5 * 60 * 1000, // 5 perc

    // Maximum cikkek
    maxArticlesPerFeed: 10,
    maxTotalArticles: 30
};

class RSSFeedManager {
    constructor() {
        this.articles = [];
        this.lastUpdate = null;
        this.currentProxyIndex = 0;
    }

    // Proxy váltás ha nem működik
    getProxyUrl() {
        return RSS_CONFIG.proxies[this.currentProxyIndex];
    }

    nextProxy() {
        this.currentProxyIndex = (this.currentProxyIndex + 1) % RSS_CONFIG.proxies.length;
    }

    // RSS feed lekérése (gyors timeout-tal)
    async fetchFeed(feedConfig) {
        const { url, category, name } = feedConfig;

        for (let attempt = 0; attempt < RSS_CONFIG.proxies.length; attempt++) {
            try {
                const proxyUrl = this.getProxyUrl() + encodeURIComponent(url);

                // 5 másodperces timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(proxyUrl, {
                    headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    this.nextProxy();
                    continue;
                }

                const text = await response.text();
                const articles = this.parseRSS(text, category, name);

                if (articles.length > 0) {
                    console.log(`✅ ${name}: ${articles.length} cikk`);
                    return articles;
                }
            } catch (error) {
                console.warn(`⚠️ ${name} hiba:`, error.message);
                this.nextProxy();
            }
        }

        return [];
    }

    // RSS XML parsing
    parseRSS(xmlText, category, sourceName) {
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');

            // Ellenőrizzük, hogy valid XML-e
            const parseError = xml.querySelector('parsererror');
            if (parseError) {
                console.warn('XML parse hiba');
                return [];
            }

            const items = xml.querySelectorAll('item');
            const articles = [];

            items.forEach((item, index) => {
                if (index >= RSS_CONFIG.maxArticlesPerFeed) return;

                const title = item.querySelector('title')?.textContent?.trim() || '';
                const link = item.querySelector('link')?.textContent?.trim() || '#';
                let description = item.querySelector('description')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || '';

                // Képet próbálunk kinyerni
                let image = '';

                // 1. enclosure tag
                const enclosure = item.querySelector('enclosure[type^="image"]');
                if (enclosure) {
                    image = enclosure.getAttribute('url');
                }

                // 2. media:content vagy media:thumbnail
                if (!image) {
                    const mediaContent = item.querySelector('content[url], thumbnail[url]');
                    if (mediaContent) {
                        image = mediaContent.getAttribute('url');
                    }
                }

                // 3. Description-ből kép
                if (!image && description) {
                    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/);
                    if (imgMatch) image = imgMatch[1];
                }

                // HTML tagek eltávolítása
                const cleanDesc = description
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .substring(0, 150);

                if (title) {
                    // Sport kulcsszó szűrés - DUPLA ELLENŐRZÉS
                    const textToCheck = (title + ' ' + cleanDesc).toLowerCase();

                    // 1. Ellenőrizzük, hogy NEM tartalmaz-e kizárt kulcsszót
                    const isExcluded = RSS_CONFIG.excludedKeywords.some(kw => textToCheck.includes(kw.toLowerCase()));

                    // 2. Ellenőrizzük, hogy TARTALMAZ-E sport kulcsszót
                    const isSport = RSS_CONFIG.sportKeywords.some(kw => textToCheck.includes(kw.toLowerCase()));

                    // Csak akkor engedjük át, ha sport ÉS nem kizárt
                    if (isSport && !isExcluded) {
                        articles.push({
                            title: title,
                            link: link,
                            description: cleanDesc.trim() + (cleanDesc.length >= 150 ? '...' : ''),
                            pubDate: this.formatDate(pubDate),
                            image: image,
                            rawDate: new Date(pubDate),
                            category: category,
                            source: sourceName
                        });
                    }
                }
            });

            return articles;
        } catch (error) {
            console.warn('Parse hiba:', error);
            return [];
        }
    }

    // Dátum formázás
    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Ma';

            const now = new Date();
            const diff = now - date;

            if (diff < 60 * 60 * 1000) {
                const mins = Math.max(1, Math.floor(diff / (60 * 1000)));
                return `${mins} perce`;
            }
            if (diff < 24 * 60 * 60 * 1000) {
                const hours = Math.floor(diff / (60 * 60 * 1000));
                return `${hours} órája`;
            }

            return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
        } catch {
            return 'Ma';
        }
    }

    // Összes feed lekérése
    async fetchAllFeeds() {
        console.log('🔄 RSS feedek frissítése...');

        const allArticles = [];

        // Párhuzamos lekérés
        const promises = RSS_CONFIG.feeds.map(feed => this.fetchFeed(feed));
        const results = await Promise.allSettled(promises);

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                allArticles.push(...result.value);
            }
        });

        // Duplikátumok szűrése cím alapján
        const uniqueArticles = [];
        const seenTitles = new Set();

        allArticles.forEach(article => {
            const titleKey = article.title.toLowerCase().substring(0, 50);
            if (!seenTitles.has(titleKey)) {
                seenTitles.add(titleKey);
                uniqueArticles.push(article);
            }
        });

        // PRIORITÁS: Képes cikkek előre, dátumon belül
        uniqueArticles.sort((a, b) => {
            // Először képes vs nem képes
            const aHasImage = a.image ? 1 : 0;
            const bHasImage = b.image ? 1 : 0;
            if (bHasImage !== aHasImage) return bHasImage - aHasImage;
            // Aztán dátum szerint
            return b.rawDate - a.rawDate;
        });

        // Limitálás
        this.articles = uniqueArticles.slice(0, RSS_CONFIG.maxTotalArticles);
        this.lastUpdate = new Date();

        const withImages = this.articles.filter(a => a.image).length;
        console.log(`✅ Összesen ${this.articles.length} cikk (${withImages} képpel)`);

        return this.articles;
    }

    // Kategória emoji
    getCategoryEmoji(category) {
        const emojis = {
            'Foci': '⚽',
            'Sport': '🏆',
            'E-sport': '🎮',
            'Tenisz': '🎾',
            'Kosárlabda': '🏀',
            'F1': '🏎️'
        };
        return emojis[category] || '📰';
    }

    // Kártya HTML generálása
    createArticleCard(article, showExcerpt = false) {
        const emoji = this.getCategoryEmoji(article.category);
        const imageStyle = article.image
            ? `background-image: url('${article.image}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(135deg, #1a1a2e 0%, #0B0B0B 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem;`;

        return `
      <article class="article-card" style="background: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222;">
        <a href="${article.link}" target="_blank" rel="noopener" class="article-image" style="display: block; aspect-ratio: 16/10; overflow: hidden; position: relative;">
          <span class="article-category" style="position: absolute; top: 12px; left: 12px; padding: 4px 12px; background: #39FF14; color: #0B0B0B; border-radius: 50px; font-size: 0.75rem; font-weight: 700; z-index: 10;">${article.category}</span>
          <div style="width: 100%; height: 100%; ${imageStyle}">
            ${article.image ? '' : emoji}
          </div>
        </a>
        <div class="article-content" style="display: block; padding: 1rem;">
          <div class="article-meta" style="display: flex; gap: 8px; font-size: 0.8rem; color: #888; margin-bottom: 8px;">
            <span>${article.pubDate}</span>
            <span>•</span>
            <span>${article.source}</span>
          </div>
          <h3 class="article-title" style="font-size: 1rem; font-weight: 700; color: #fff; line-height: 1.4; margin: 0;">${article.title}</h3>
          ${showExcerpt && article.description ? `<p class="article-excerpt" style="font-size: 0.85rem; color: #888; margin-top: 8px; line-height: 1.5;">${article.description}</p>` : ''}
        </div>
      </article>
    `;
    }

    // Featured kártya (nagyobb)
    createFeaturedCard(article) {
        const emoji = this.getCategoryEmoji(article.category);
        const imageStyle = article.image
            ? `background-image: url('${article.image}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(135deg, #1a472a 0%, #0B0B0B 100%); display: flex; align-items: center; justify-content: center; font-size: 5rem;`;

        return `
      <article class="article-card featured" style="background: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222; display: grid; grid-template-columns: 1.5fr 1fr;">
        <a href="${article.link}" target="_blank" rel="noopener" class="article-image" style="display: block; min-height: 300px; overflow: hidden; position: relative;">
          <span class="article-category" style="position: absolute; top: 12px; left: 12px; padding: 4px 12px; background: #39FF14; color: #0B0B0B; border-radius: 50px; font-size: 0.75rem; font-weight: 700; z-index: 10;">${article.category}</span>
          <div style="width: 100%; height: 100%; ${imageStyle}">
            ${article.image ? '' : emoji}
          </div>
        </a>
        <div class="article-content" style="display: flex; flex-direction: column; justify-content: center; padding: 1.5rem;">
          <div class="article-meta" style="display: flex; gap: 8px; font-size: 0.85rem; color: #888; margin-bottom: 10px;">
            <span>${article.pubDate}</span>
            <span>•</span>
            <span>${article.source}</span>
          </div>
          <h3 class="article-title" style="font-size: 1.4rem; font-weight: 700; color: #fff; line-height: 1.3; margin: 0 0 12px 0;">${article.title}</h3>
          <p class="article-excerpt" style="font-size: 0.9rem; color: #888; line-height: 1.6; margin: 0;">${article.description || 'Kattints a teljes cikkért...'}</p>
        </div>
      </article>
    `;
    }

    // Sidebar cikk
    createSidebarArticle(article) {
        const emoji = this.getCategoryEmoji(article.category);
        const imgContent = article.image
            ? `<img src="${article.image}" alt="" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='${emoji}';">`
            : emoji;

        return `
      <a href="${article.link}" target="_blank" rel="noopener" class="popular-article">
        <div class="popular-article-image">
          <div style="width: 100%; height: 100%; background: var(--bg-dark); display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${imgContent}
          </div>
        </div>
        <div>
          <h5 class="popular-article-title">${article.title}</h5>
        </div>
      </a>
    `;
    }

    // DOM frissítése
    updateDOM() {
        if (this.articles.length === 0) {
            console.warn('Nincs cikk a megjelenítéshez');
            return;
        }

        // Kiemelt cikkek (első 3)
        const featuredGrid = document.querySelector('.articles-grid.featured');
        if (featuredGrid && this.articles.length >= 3) {
            featuredGrid.innerHTML = `
        ${this.createFeaturedCard(this.articles[0])}
        <div>
          ${this.createArticleCard(this.articles[1])}
          ${this.createArticleCard(this.articles[2])}
        </div>
      `;
        }

        // Legfrissebb cikkek (3-9)
        const latestGrid = document.getElementById('latest-articles-grid');
        if (latestGrid) {
            const latestArticles = this.articles.slice(3, 9);
            if (latestArticles.length > 0) {
                latestGrid.innerHTML = latestArticles
                    .map(a => this.createArticleCard(a, true))
                    .join('');
            }
        }

        // Népszerű cikkek - NEM frissítjük RSS-szel, a saját cikkek maradnak!
        // const popularGrid = document.getElementById('popular-articles-grid');
        // if (popularGrid) {
        //     const popularArticles = this.articles.slice(9, 13);
        //     if (popularArticles.length > 0) {
        //         popularGrid.innerHTML = popularArticles
        //             .map(a => this.createArticleCard(a))
        //             .join('');
        //     }
        // }

        // Sidebar (14-18)
        const sidebar = document.getElementById('sidebar-popular');
        if (sidebar) {
            const sidebarArticles = this.articles.slice(13, 17);
            if (sidebarArticles.length > 0) {
                sidebar.innerHTML = `
          <h4 class="sidebar-title">📌 Legnépszerűbb</h4>
          ${sidebarArticles.map(a => this.createSidebarArticle(a)).join('')}
        `;
            }
        }

        console.log(`🕐 DOM frissítve: ${new Date().toLocaleTimeString('hu-HU')}`);
    }

    // Inicializálás
    async init() {
        // Loading jelzés
        const latestGrid = document.getElementById('latest-articles-grid');
        if (latestGrid) {
            latestGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">🔄 Hírek betöltése...</div>';
        }

        // Feedek lekérése
        await this.fetchAllFeeds();
        this.updateDOM();

        // Automatikus frissítés
        setInterval(async () => {
            await this.fetchAllFeeds();
            this.updateDOM();
        }, RSS_CONFIG.refreshInterval);
    }
}

// Globális példány és indítás
const rssManager = new RSSFeedManager();

document.addEventListener('DOMContentLoaded', () => {
    // Azonnal indítás késleltetés nélkül
    rssManager.init();
});
