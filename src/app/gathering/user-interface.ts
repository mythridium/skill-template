import { Gathering } from './gathering';
import { GatheringItemComponent } from './gathering-item/gathering-item';
import { GatheringItem } from './gathering.types';

export class UserInterface {
    public readonly gatheringItems = new Map<GatheringItem, ReturnType<typeof GatheringItemComponent>>();

    public get mainContainer() {
        return document.getElementById('main-container');
    }

    public get gatheringContainer() {
        return document.getElementById('gathering-item-container');
    }

    constructor(
        private readonly context: Modding.ModContext,
        private readonly game: Game,
        private readonly gathering: Gathering
    ) {}

    public init() {
        this.context.onInterfaceAvailable(async () => {
            this.mainContainer.append(...this.gathering.elements);

            for (const gatheringItem of this.gathering.actions.registeredObjects.values()) {
                const component = GatheringItemComponent(this.game, this.gathering, gatheringItem);

                ui.create(component, this.gatheringContainer);

                this.gatheringItems.set(gatheringItem, component);
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

        const skillInfo = mainContainer.querySelector('#gathering-container .gathering-skill-info');

        if (!skillInfo) {
            return;
        }

        skillInfo.classList.remove('skill-info');
        skillInfo.classList.add('skill-info-mobile');
    }
}
