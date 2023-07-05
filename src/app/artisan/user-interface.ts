import { Artisan } from './artisan';
import { ArtisanCategory, ArtisanSelectionTab } from './artisan.types';

export class UserInterface {
    public get mainContainer() {
        return document.getElementById('main-container');
    }

    public get artisanContainer() {
        return document.getElementById('artisan-item-container');
    }

    constructor(
        private readonly context: Modding.ModContext,
        private readonly game: Game,
        private readonly artisan: Artisan
    ) {}

    public init() {
        this.context.onInterfaceAvailable(async () => {
            this.mainContainer.append(...this.artisan.elements);

            this.artisan._menu = new ArtisanMenu('artisan-artisan-container', this.artisan);
            this.artisan._categoryMenu = new CategoryMenu<ArtisanCategory>(
                'artisan-category-menu',
                'horizontal-navigation-artisan',
                this.artisan.categories.allObjects,
                'SELECT_ARTISAN_CATEGORY',
                switchToCategory(this.artisan.selectionTabs)
            );

            for (const category of this.artisan.categories.registeredObjects.values()) {
                this.artisan.selectionTabs.set(category, new ArtisanSelectionTab(this.game, category));
            }

            this.modifySkillInfoClass(this.mainContainer);
        });
    }

    private modifySkillInfoClass(mainContainer: HTMLElement) {
        // The isMobile function is bugged as it doesn't actually call isAndroid???
        const isMobile = isIOS() || isAndroid() || location.pathname.includes('index_mobile.php');

        if (!isMobile) {
            return;
        }

        const skillInfo = mainContainer.querySelector('#artisan-container .artisan-skill-info');

        if (!skillInfo) {
            return;
        }

        skillInfo.classList.remove('skill-info');
        skillInfo.classList.add('skill-info-mobile');
    }
}
