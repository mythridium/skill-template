import { Artisan } from './artisan';

export interface ArtisanSkillData extends MasterySkillData {
    categories?: SkillCategoryData[];
    recipes?: ArtisanRecipeData[];
}

export interface ArtisanRecipeData extends SingleProductArtisanSkillRecipeData {
    name: string;
    media: string;
}

export class ArtisanCategory extends SkillCategory {}

export class ArtisanRecipe extends SingleProductArtisanSkillRecipe<ArtisanCategory> {
    constructor(namespace: DataNamespace, data: ArtisanRecipeData, game: Game, artisan: Artisan) {
        super(namespace, data, game, artisan);
    }
}

export class ArtisanSelectionTab extends RecipeSelectionTab<ArtisanRecipe> {
    constructor(private readonly game: Game, category: ArtisanCategory) {
        const artisan = game.skills.getObjectByID('mythSkillTemplate:Artisan') as Artisan;
        const recipes = artisan.actions.filter(recipe => recipe.category === category);

        recipes.sort((a, b) => a.level - b.level);

        super(`artisan-category-container`, artisan, recipes, `artisan-category-${category.id}`);

        this.hide();
    }

    public getRecipeMedia(recipe: ArtisanRecipe) {
        return recipe.media;
    }

    public getRecipeName(recipe: ArtisanRecipe) {
        return recipe.name;
    }

    public getRecipeCallback(recipe: ArtisanRecipe) {
        return () => {
            const artisan = this.game.skills.getObjectByID('mythSkillTemplate:Artisan') as Artisan;

            return artisan.selectRecipeOnClick(recipe);
        };
    }

    public getRecipeIngredients(recipe: ArtisanRecipe) {
        const artisan = this.game.skills.getObjectByID('mythSkillTemplate:Artisan') as Artisan;

        return artisan.getRecipeCosts(recipe);
    }
}
