import { Artisan } from './artisan';
import { ArtisanRecipe } from './artisan.types';

export class ArtisanActionEvent extends SkillActionEvent {
    public skill: Artisan;
    public action: ArtisanRecipe;

    constructor(skill: Artisan, action: ArtisanRecipe) {
        super();

        this.skill = skill;
        this.action = action;
    }
}

export interface ArtisanActionEventMatcherOptions extends SkillActionEventMatcherOptions {
    type: 'ArtisanAction';
    actionIDs?: string[];
}

export class ArtisanActionEventMatcher extends SkillActionEventMatcher {
    /** If present, the recipe of the action must match a member */
    public actions?: Set<ArtisanRecipe>;

    constructor(options: ArtisanActionEventMatcherOptions, game: Game) {
        super(options, game);

        if (options.actionIDs !== undefined) {
            const gathering = game.skills.find(skill => skill.id === 'mythSkillTemplate:Artisan') as Artisan;

            this.actions = gathering.actions.getSetForConstructor(options.actionIDs, this, ArtisanRecipe.name);
        }
    }

    public doesEventMatch(event: GameEvent): boolean {
        return (
            event instanceof ArtisanActionEvent &&
            (this.actions === undefined || this.actions.has(event.action)) &&
            super.doesEventMatch(event)
        );
    }
}
