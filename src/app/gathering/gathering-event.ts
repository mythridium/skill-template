import { Gathering } from './gathering';
import { GatheringItem } from './gathering.types';

export class GatheringActionEvent extends SkillActionEvent {
    public skill: Gathering;
    public action: GatheringItem;

    constructor(skill: Gathering, action: GatheringItem) {
        super();

        this.skill = skill;
        this.action = action;
    }
}

export interface GatheringActionEventMatcherOptions extends SkillActionEventMatcherOptions {
    type: 'GatheringAction';
    actionIDs?: string[];
}

export class GatheringActionEventMatcher extends SkillActionEventMatcher {
    /** If present, the recipe of the action must match a member */
    public actions?: Set<GatheringItem>;

    constructor(options: GatheringActionEventMatcherOptions, game: Game) {
        super(options, game);

        if (options.actionIDs !== undefined) {
            const gathering = game.skills.find(skill => skill.id === 'mythSkillTemplate:Gathering') as Gathering;

            this.actions = gathering.actions.getSetForConstructor(options.actionIDs, this, GatheringItem.name);
        }
    }

    public doesEventMatch(event: GameEvent): boolean {
        return (
            event instanceof GatheringActionEvent &&
            (this.actions === undefined || this.actions.has(event.action)) &&
            super.doesEventMatch(event)
        );
    }
}
