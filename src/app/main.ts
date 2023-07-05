import { Gathering } from './gathering/gathering';
import { Artisan } from './artisan/artisan';
import { UserInterface as GatheringUserInterface } from './gathering/user-interface';
import { UserInterface as ArtisanUserInterface } from './artisan/user-interface';
import { GatheringActionEventMatcher, GatheringActionEventMatcherOptions } from './gathering/gathering-event';
import { ArtisanActionEventMatcher, ArtisanActionEventMatcherOptions } from './artisan/artisan-event';

type CustomEventOptions = GameEventMatcherData | GatheringActionEventMatcherOptions | ArtisanActionEventMatcherOptions;

declare global {
    interface Game {
        constructEventMatcher(data: CustomEventOptions): GameEventMatcher;
    }
}

export class App {
    constructor(private readonly context: Modding.ModContext, private readonly game: Game) {}

    public async init() {
        await this.context.loadTemplates('gathering/gathering.html');
        await this.context.loadTemplates('gathering/gathering-item/gathering-item.html');
        await this.context.loadTemplates('artisan/artisan.html');

        this.patchEventManager();

        const gathering = this.game.registerSkill(
            this.game.registeredNamespaces.getNamespace('mythSkillTemplate'),
            Gathering
        );

        const artisan = this.game.registerSkill(
            this.game.registeredNamespaces.getNamespace('mythSkillTemplate'),
            Artisan
        );

        await this.context.gameData.addPackage('data.json');

        gathering.userInterface = this.initGatheringInterface(gathering);
        artisan.userInterface = this.initArtisanInterface(artisan);

        // Fix completion log bug that doesn't set current level for modded skills.
        this.context.patch(Completion, 'updateSkillProgress').after(() => {
            this.game.completion.skillProgress.currentCount.add(gathering.namespace, Math.max(gathering.level, 0));
            this.game.completion.skillProgress.currentCount.add(artisan.namespace, Math.max(artisan.level, 0));
        });
    }

    /** Need to patch the event matcher as we cannot inject our new events into it. */
    private patchEventManager() {
        this.context.patch(Game, 'constructEventMatcher').after((_patch, data) => {
            if (this.isGatheringEvent(data)) {
                return new GatheringActionEventMatcher(data, this.game);
            }

            if (this.isArtisanEvent(data)) {
                return new ArtisanActionEventMatcher(data, this.game);
            }
        });
    }

    private isGatheringEvent(data: CustomEventOptions): data is GatheringActionEventMatcherOptions {
        return data.type === 'GatheringAction';
    }

    private isArtisanEvent(data: CustomEventOptions): data is ArtisanActionEventMatcherOptions {
        return data.type === 'ArtisanAction';
    }

    private initGatheringInterface(gathering: Gathering) {
        const userInterface = new GatheringUserInterface(this.context, this.game, gathering);

        userInterface.init();

        return userInterface;
    }

    private initArtisanInterface(artisan: Artisan) {
        const userInterface = new ArtisanUserInterface(this.context, this.game, artisan);

        userInterface.init();

        return userInterface;
    }
}
