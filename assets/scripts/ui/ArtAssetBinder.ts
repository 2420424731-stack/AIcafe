import { assetManager, Button, EditBox, Label, Node, ProgressBar, Sprite, SpriteFrame, UITransform } from 'cc';

export type ArtKey =
    | 'mainBackground'
    | 'resultBackground'
    | 'chatPanel'
    | 'prepPanel'
    | 'resultPanel'
    | 'productRow'
    | 'topStatusBar'
    | 'inputBox'
    | 'desireBarBg'
    | 'desireBarFill'
    | 'bubbleCustomer'
    | 'bubblePlayer'
    | 'bubbleSystem'
    | 'buttonPrimaryNormal'
    | 'buttonPrimaryPressed'
    | 'buttonPrimaryDisabled'
    | 'buttonSecondaryNormal'
    | 'buttonSecondaryPressed'
    | 'buttonSecondaryDisabled'
    | 'buttonSmallNormal'
    | 'buttonSmallPressed'
    | 'buttonSmallDisabled'
    | 'product_americano'
    | 'product_latte'
    | 'product_croissant'
    | 'product_coconut_latte'
    | 'product_tiramisu'
    | 'product_blue_mountain'
    | 'customer_introvert'
    | 'customer_expert'
    | 'customer_artistic'
    | 'customer_social'
    | 'customer_worker'
    | 'customer_hesitant'
    | 'iconMoney'
    | 'iconDay'
    | 'iconReputation'
    | 'iconPhase'
    | 'iconSend'
    | 'iconHint'
    | 'iconInfo'
    | 'iconProfit'
    | 'iconCustomer';

const ART_UUIDS: Record<ArtKey, string> = {
    mainBackground: '3cd77991-9cf8-4230-8612-10dd73e9dba0@f9941',
    resultBackground: '9cbc1d3e-08f6-4e46-8d63-e13663ff9ecc@f9941',
    chatPanel: '8c8ac5a0-d3b8-42c9-9829-16d02bcb1288@f9941',
    prepPanel: '9ab840aa-0b83-4d4b-9985-019acc2ce635@f9941',
    resultPanel: '9cbc1d3e-08f6-4e46-8d63-e13663ff9ecc@f9941',
    productRow: '960cb9cd-053b-4acc-8c4b-e3a1dc7718b5@f9941',
    topStatusBar: 'd2b54685-0e08-425f-8e97-8adc64f3d15f@f9941',
    inputBox: '6b120ae4-8cf1-4d4e-a9dc-95debf11a48c@f9941',
    desireBarBg: '6d90d704-087f-4a60-8d63-d51f1ff7a9f3@f9941',
    desireBarFill: '83fa11b1-37cc-48de-81eb-4e9dbb8c568d@f9941',
    bubbleCustomer: '81c35125-57a7-428a-be02-ca04cd7ee8a2@f9941',
    bubblePlayer: '1c943d64-17a3-4454-8962-c086e554365f@f9941',
    bubbleSystem: 'c86507ce-8960-4eb1-8a73-1b8338535dba@f9941',
    buttonPrimaryNormal: 'a02c6b70-9278-4377-89e1-174512d4c4c5@f9941',
    buttonPrimaryPressed: '0a6afbdb-a6c0-42e1-9c40-de429f146e63@f9941',
    buttonPrimaryDisabled: '1c80491c-23e2-4510-a5c4-0aa9bca5c816@f9941',
    buttonSecondaryNormal: '80e9eb91-4928-4f40-a8c6-3b1ea828c35a@f9941',
    buttonSecondaryPressed: 'ff9194fb-16da-46d8-858a-d223cba33f3a@f9941',
    buttonSecondaryDisabled: '8f8d5760-525b-47e0-b206-918a05882804@f9941',
    buttonSmallNormal: '3aa88756-cc09-4695-884f-b0f95cb4eb0a@f9941',
    buttonSmallPressed: '1db50f87-71c2-4993-aed1-392f3c3ef0c4@f9941',
    buttonSmallDisabled: '665852af-8231-4b78-a329-c34ddbb73602@f9941',
    product_americano: 'fdb043c6-2541-438b-af2c-74434247bc9b@f9941',
    product_latte: 'ee52ff62-2b92-400b-9de3-7e0b24db8429@f9941',
    product_croissant: 'e43cb763-cab2-4df3-97ce-2dd55023ae18@f9941',
    product_coconut_latte: 'bd5a3cee-0728-4d37-898e-80c515736637@f9941',
    product_tiramisu: 'd9fd2ba4-a055-48bf-9bc8-b699085af6a0@f9941',
    product_blue_mountain: 'd06f0504-17f7-4470-b213-6d7a897db9a8@f9941',
    customer_introvert: '8afa0186-4367-4b36-b91d-84d449782f57@f9941',
    customer_expert: 'fa558c7a-b490-46fe-8d90-d8143e44b923@f9941',
    customer_artistic: '3910af53-1ad8-475a-b492-21ccc56189a0@f9941',
    customer_social: 'ce61e5f5-9663-4974-a83e-e031d02c646b@f9941',
    customer_worker: '2896132c-877f-4ea0-89bf-7b88cc2cf857@f9941',
    customer_hesitant: '24a19c8b-88fc-4766-b18f-62b25b4eb4c4@f9941',
    iconMoney: '6dfeeec6-9f3f-4906-af33-3fe06f56e785@f9941',
    iconDay: '0fb4c4bb-68e3-4017-b9c8-d784ef03295a@f9941',
    iconReputation: 'b3d8a1bb-d334-4a5e-b74b-c06f0cc697e9@f9941',
    iconPhase: 'bd80b8c6-da25-46f2-8cfb-a64dfc95101f@f9941',
    iconSend: '8761eab1-0a35-4da4-9ee3-57635882c7e2@f9941',
    iconHint: '5255644c-213b-46c9-a341-718851e7c5a3@f9941',
    iconInfo: '8a4fc9ee-bd9f-4d67-9b5e-da1a4e961c44@f9941',
    iconProfit: '5d149d35-c72b-40e7-b1c8-2ca5427bd0e5@f9941',
    iconCustomer: 'e9f686ad-bd43-4552-b711-19a035f687a1@f9941',
};

const spriteFrameCache = new Map<ArtKey, SpriteFrame>();

export class ArtAssetBinder {
    static applySprite(node: Node | null, key: ArtKey, width?: number, height?: number): void {
        if (!node) {
            return;
        }

        const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
        const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        if (width && height) {
            transform.setContentSize(width, height);
        }

        ArtAssetBinder.loadSpriteFrame(key, (frame) => {
            if (Sprite.SizeMode?.CUSTOM !== undefined) {
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            }
            sprite.spriteFrame = frame;
            if (width && height) {
                transform.setContentSize(width, height);
            }
        });
    }

    static ensureSpriteNode(
        parent: Node | null,
        name: string,
        key: ArtKey,
        width: number,
        height: number,
        x = 0,
        y = 0,
        siblingIndex?: number,
    ): Node | null {
        if (!parent) {
            return null;
        }

        let node = parent.getChildByName(name);
        if (!node) {
            node = new Node(name);
            parent.addChild(node);
        }

        node.layer = parent.layer;
        if (siblingIndex !== undefined) {
            node.setSiblingIndex(siblingIndex);
        }
        node.setPosition(x, y, 0);
        ArtAssetBinder.applySprite(node, key, width, height);
        return node;
    }

    static applyButton(node: Node | null, size: 'primary' | 'secondary' | 'small' = 'primary'): void {
        if (!node) {
            return;
        }

        const normalKey = `button${ArtAssetBinder.toTitle(size)}Normal` as ArtKey;
        const pressedKey = `button${ArtAssetBinder.toTitle(size)}Pressed` as ArtKey;
        const disabledKey = `button${ArtAssetBinder.toTitle(size)}Disabled` as ArtKey;
        const button = node.getComponent(Button) ?? node.addComponent(Button);

        ArtAssetBinder.loadSpriteFrame(normalKey, (frame) => {
            const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
            if (Sprite.SizeMode?.CUSTOM !== undefined) {
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            }
            sprite.spriteFrame = frame;
            button.normalSprite = frame;
        });
        ArtAssetBinder.loadSpriteFrame(pressedKey, (frame) => {
            button.pressedSprite = frame;
            button.hoverSprite = frame;
        });
        ArtAssetBinder.loadSpriteFrame(disabledKey, (frame) => {
            button.disabledSprite = frame;
        });

        node.children.forEach((child) => {
            const label = child.getComponent(Label);
            if (label) {
                label.color.fromHEX('#ffffff');
            }
        });
    }

    static applyEditBox(editBox: EditBox | null): void {
        if (!editBox) {
            return;
        }

        ArtAssetBinder.applySprite(editBox.node, 'inputBox');
        ArtAssetBinder.loadSpriteFrame('inputBox', (frame) => {
            editBox.backgroundImage = frame;
        });
    }

    static applyProgressBar(progressBar: ProgressBar | null): void {
        if (!progressBar) {
            return;
        }

        ArtAssetBinder.applySprite(progressBar.node, 'desireBarBg');
        if (progressBar.barSprite) {
            ArtAssetBinder.loadSpriteFrame('desireBarFill', (frame) => {
                progressBar.barSprite!.spriteFrame = frame;
            });
        }
    }

    static productKey(productId: string): ArtKey | null {
        const key = `product_${productId}` as ArtKey;
        return ART_UUIDS[key] ? key : null;
    }

    static customerKey(customerId: string): ArtKey | null {
        const key = `customer_${customerId}` as ArtKey;
        return ART_UUIDS[key] ? key : null;
    }

    static getMissingOptionalAssets(): string[] {
        return ['effects/customer_leave.png', 'effects/day_end_stamp.png', 'effects/unlock_badge.png'];
    }

    private static loadSpriteFrame(key: ArtKey, onLoaded: (frame: SpriteFrame) => void): void {
        const cached = spriteFrameCache.get(key);
        if (cached) {
            onLoaded(cached);
            return;
        }

        const uuid = ART_UUIDS[key];
        if (!uuid) {
            return;
        }

        (assetManager as any).loadAny({ uuid }, (error: Error | null, asset: SpriteFrame) => {
            if (error || !asset) {
                console.warn(`[ArtAssetBinder] 素材加载失败：${key}`, error);
                return;
            }

            spriteFrameCache.set(key, asset);
            onLoaded(asset);
        });
    }

    private static toTitle(value: string): string {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
}
