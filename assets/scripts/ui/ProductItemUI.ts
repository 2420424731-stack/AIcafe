import { _decorator, Button, Color, Component, EditBox, Label, Node, UITransform } from 'cc';
import { EventBus, GameEvent } from '../core/EventBus';
import { GameManager, GamePhase } from '../core/GameManager';
import { ProductData } from '../data/ProductData';
import { ArtAssetBinder } from './ArtAssetBinder';

const { ccclass, property } = _decorator;

@ccclass('ProductItemUI')
export class ProductItemUI extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    costLabel: Label | null = null;

    @property(Label)
    stockLabel: Label | null = null;

    @property(EditBox)
    priceInput: EditBox | null = null;

    @property(EditBox)
    amountInput: EditBox | null = null;

    product: ProductData | null = null;
    onBuyClicked: ((product: ProductData, amount: number, price: number) => void) | null = null;
    private showingProductInfo = false;
    private infoButtonNode: Node | null = null;

    onEnable(): void {
        EventBus.on(GameEvent.GameStateChanged, this.refreshByGameState);
    }

    onDisable(): void {
        EventBus.off(GameEvent.GameStateChanged, this.refreshByGameState);
    }

    setup(product: ProductData, onBuyClicked: (product: ProductData, amount: number, price: number) => void): void {
        this.product = product;
        this.onBuyClicked = onBuyClicked;
        this.showingProductInfo = false;

        this.applyCompactLayout();
        this.ensureInfoButton();
        this.applyArtAssets();
        if (this.nameLabel) this.nameLabel.string = product.name;
        if (this.priceInput) this.priceInput.string = String(GameManager.instance?.getProductPrice(product.id) ?? product.suggestedPrice);
        if (this.amountInput) this.amountInput.string = '1';
        this.refreshByGameState();
    }

    toggleProductInfo(): void {
        this.showingProductInfo = !this.showingProductInfo;
        this.refreshStockDisplay();
    }

    handleBuyButton(): void {
        if (!this.product || !this.onBuyClicked) {
            return;
        }

        if (GameManager.instance?.phase !== GamePhase.Prep) {
            this.refreshByGameState();
            return;
        }

        const amount = this.readPositiveInteger(this.amountInput?.string, 1);
        const price = this.readPositiveInteger(this.priceInput?.string, this.product.suggestedPrice);
        this.onBuyClicked(this.product, amount, price);
        this.refreshByGameState();
    }

    private refreshByGameState = (): void => {
        if (!this.product) {
            return;
        }

        this.refreshStockDisplay();
        this.refreshControls();
        this.applyArtAssets();
    };

    private refreshStockDisplay(): void {
        if (!this.product) {
            return;
        }

        const game = GameManager.instance;
        const stock = GameManager.instance?.getProductStockAmount(this.product.id) ?? 0;
        const price = game?.getProductPrice(this.product.id) ?? this.product.suggestedPrice;
        if (this.showingProductInfo) {
            if (this.costLabel) this.costLabel.string = `介绍：${this.product.description}`;
            if (this.stockLabel) this.stockLabel.string = `标签：${this.product.tags.join('、') || '无'}`;
        } else {
            if (this.costLabel) this.costLabel.string = `成本${this.product.cost} 建议${this.product.suggestedPrice} 售价${price} 库存${stock}`;
            if (this.stockLabel) this.stockLabel.string = `售价：${price}｜库存：${stock}`;
        }
        if (this.priceInput && GameManager.instance?.phase !== GamePhase.Prep) {
            this.priceInput.string = String(price);
        }
    }

    private refreshControls(): void {
        const canEdit = GameManager.instance?.phase === GamePhase.Prep;
        const buyButton = this.node.getChildByName('BuyButton');
        const button = buyButton?.getComponent(Button);

        if (button) button.interactable = canEdit;
        if (buyButton) buyButton.active = canEdit;
        if (this.priceInput) this.priceInput.enabled = canEdit;
        if (this.amountInput) this.amountInput.enabled = canEdit;
    }

    private applyCompactLayout(): void {
        const transform = this.node.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(390, 74);
        }

        this.setNodeLayout('ProductIcon', -166, 0, 44, 44);
        this.setNodeLayout('NameLabel', -108, 12, 102, 24);
        this.setNodeLayout('CostLabel', 42, 12, 196, 24);
        this.setNodeLayout('PriceInput', -82, -22, 60, 28);
        this.setNodeLayout('AmountInput', -12, -22, 46, 28);
        this.setNodeLayout('BuyButton', 62, -22, 62, 30);
        this.setNodeLayout('InfoButton', 132, -22, 58, 30);

        this.styleLabel(this.nameLabel, 15, 20);
        if (this.costLabel) {
            this.costLabel.fontSize = 12;
            this.costLabel.lineHeight = 16;
            this.costLabel.enableWrapText = true;
            this.costLabel.color = new Color(92, 61, 43, 255);
        }
        if (this.stockLabel) {
            this.stockLabel.fontSize = 12;
            this.stockLabel.lineHeight = 16;
            this.stockLabel.enableWrapText = true;
            this.stockLabel.color = new Color(92, 61, 43, 255);
        }
    }

    private ensureInfoButton(): void {
        let buttonNode = this.node.getChildByName('InfoButton');
        if (!buttonNode) {
            buttonNode = new Node('InfoButton');
            this.node.addChild(buttonNode);
            buttonNode.addComponent(UITransform);
            buttonNode.addComponent(Button);

            const labelNode = new Node('Label');
            buttonNode.addChild(labelNode);
            labelNode.addComponent(UITransform);
            const label = labelNode.addComponent(Label);
            label.string = '介绍';
            label.fontSize = 13;
            label.lineHeight = 18;
        }

        this.infoButtonNode = buttonNode;
        buttonNode.layer = this.node.layer;
        this.setNodeLayout('InfoButton', 132, -22, 58, 30);
        const label = buttonNode.getChildByName('Label')?.getComponent(Label);
        if (label) {
            label.string = '介绍';
            label.fontSize = 12;
            label.lineHeight = 18;
            label.node.setPosition(6, 0, 0);
            label.node.getComponent(UITransform)?.setContentSize(48, 22);
        }

        buttonNode.off(Button.EventType.CLICK, this.toggleProductInfo, this);
        buttonNode.on(Button.EventType.CLICK, this.toggleProductInfo, this);
    }

    private applyArtAssets(): void {
        ArtAssetBinder.applySprite(this.node, 'productRow', 390, 74);
        ArtAssetBinder.applyButton(this.node.getChildByName('BuyButton'), 'small');
        ArtAssetBinder.applyButton(this.node.getChildByName('InfoButton'), 'small');
        ArtAssetBinder.applyEditBox(this.priceInput);
        ArtAssetBinder.applyEditBox(this.amountInput);
        this.styleLabel(this.nameLabel, 15, 20);
        this.styleLabel(this.costLabel, 12, 16);
        this.styleLabel(this.stockLabel, 12, 16);
        this.styleEditBox(this.priceInput);
        this.styleEditBox(this.amountInput);

        const productKey = this.product ? ArtAssetBinder.productKey(this.product.id) : null;
        if (productKey) {
            ArtAssetBinder.ensureSpriteNode(this.node, 'ProductIcon', productKey, 44, 44, -166, 0, 0);
        }

        const infoButton = this.node.getChildByName('InfoButton');
        if (infoButton) {
            ArtAssetBinder.ensureSpriteNode(infoButton, 'InfoIcon', 'iconInfo', 14, 14, -18, 0, 0);
        }
    }

    private styleLabel(label: Label | null, fontSize: number, lineHeight: number): void {
        if (!label) {
            return;
        }

        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.enableWrapText = true;
        label.color = new Color(92, 61, 43, 255);
    }

    private styleEditBox(editBox: EditBox | null): void {
        if (!editBox) {
            return;
        }

        editBox.textLabel?.color.set(92, 61, 43, 255);
        editBox.placeholderLabel?.color.set(150, 124, 101, 255);
        if (editBox.textLabel) {
            editBox.textLabel.fontSize = 13;
        }
        if (editBox.placeholderLabel) {
            editBox.placeholderLabel.fontSize = 12;
        }
    }

    private setNodeLayout(name: string, x: number, y: number, width: number, height: number): void {
        const child = this.node.getChildByName(name);
        if (!child) {
            return;
        }

        child.setPosition(x, y, 0);
        child.getComponent(UITransform)?.setContentSize(width, height);
    }

    private readPositiveInteger(value: string | undefined, fallback: number): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return fallback;
        }

        return Math.floor(parsed);
    }
}
