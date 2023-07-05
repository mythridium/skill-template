import { Gathering } from '../gathering';
import { GatheringItem } from '../gathering.types';

import './gathering-item.scss';

export function GatheringItemComponent(game: Game, gathering: Gathering, gatheringItem: GatheringItem) {
    return {
        $template: '#myth-skill-template-gathering-item',
        gatheringItem,
        gatheringItemName: gatheringItem.name,
        media: gatheringItem.media,
        id: gatheringItem.id,
        localId: gatheringItem.localID.toLowerCase(),
        progressBar: {} as ProgressBar,
        mounted: function () {
            const grantsContainer = document
                .querySelector(`#${this.localId}`)
                .querySelector('#grants-container') as HTMLElement;

            this.xpIcon = new XPIcon(grantsContainer, 0, 0, 32);
            this.masteryIcon = new MasteryXPIcon(grantsContainer, 0, 0, 32);
            this.masteryPoolIcon = new MasteryPoolIcon(grantsContainer, 0, 32);
            this.intervalIcon = new IntervalIcon(grantsContainer, 0, 32);

            const progressBar = document
                .querySelector(`#${this.localId}`)
                .querySelector('.progress-bar') as HTMLElement;

            this.progressBar = new ProgressBar(progressBar, 'bg-secondary');
        },
        updateGrants: function (
            xp: number,
            baseXP: number,
            masteryXP: number,
            baseMasteryXP: number,
            masteryPoolXP: number,
            interval: number
        ) {
            this.xpIcon.setXP(xp, baseXP);
            this.masteryIcon.setXP(masteryXP, baseMasteryXP);
            this.masteryPoolIcon.setXP(masteryPoolXP);
            this.intervalIcon.setInterval(interval);
        },
        train: function () {
            gathering.train(gatheringItem);
        }
    };
}
