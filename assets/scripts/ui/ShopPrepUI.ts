import { _decorator, Button, Component, Node, Prefab, UITransform, instantiate } from 'cc';
import { EventBus, GameEvent } from '../core/EventBus';
import { GameManager, GamePhase } from '../core/GameManager';
import { DayManager } from '../core/DayManager';
import { ProductData } from '../data/ProductData';
import { ProductItemUI } from './ProductItemUI';

const { ccclass, property } = _decorator;

@ccclass('ShopPrepUI')
export class ShopPrepUI extends Component {
    @property(Node)
    productListRoot: Node | null = null;

    @property(Prefab)
    productItemPrefab: Prefab | null = null;

    @property(DayManager)
    dayManager: DayManager | null = null;

    onEnable(): void {
        EventBus.on(GameEvent.GameStateChanged, this.refreshPhaseControls);
        this.refreshProducts();
        this.refreshPhaseControls();
    }

    onDisable(): void {
        EventBus.off(GameEvent.GameStateChanged, this.refreshPhaseControls);
    }

    refreshProducts(): void {
        const game = GameManager.instance;
        if (!game || !this.productListRoot || !this.productItemPrefab) {
            return;
        }

        this.productListRoot.removeAllChildren();

        this.productListRoot.getComponent(UITransform)?.setContentSize(400, 390);

        game.getUnlockedProducts().forEach((product, index) => {
            const itemNode = instantiate(this.productItemPrefab!);
            this.productListRoot!.addChild(itemNode);
            itemNode.setPosition(0, 145 - index * 82, 0);
            itemNode.getComponent(ProductItemUI)?.setup(product, this.buyProduct);
        });

        this.refreshPhaseControls();
    }

    startBusiness(): void {
        if (GameManager.instance?.phase !== GamePhase.Prep) {
            return;
        }

        if (this.dayManager) {
            this.dayManager.startBusinessDay();
            return;
        }

        this.node.emit('start-business');
    }

    private buyProduct = (product: ProductData, amount: number, price: number): void => {
        const game = GameManager.instance;
        if (!game || game.phase !== GamePhase.Prep) {
            return;
        }

        game.setProductPrice(product.id, price);
        game.buyProduct(product.id, amount, price);
    };

    private refreshPhaseControls = (): void => {
        const canPrep = GameManager.instance?.phase === GamePhase.Prep;
        const startButtonNode = this.node.getChildByName('StartBusinessButton');
        const startButton = startButtonNode?.getComponent(Button);

        if (startButtonNode) startButtonNode.active = canPrep;
        if (startButton) startButton.interactable = canPrep;
    };
}
