class EndScene extends Phaser.Scene {
    constructor() {
        super("endScene");
    }

    create() {
        const { width, height } = this.scale;
        this.add.text(width/2, height/2 - 20, "You Win!", {
            font: "48px sans-serif",
            color: "#ffffff"
        }).setOrigin(0.5);

        this.add.text(width/2, height/2 + 20, "Press R to play again", {
            font: "24px sans-serif",
            color: "#ffff00"
        }).setOrigin(0.5);

        this.input.keyboard.on("keydown-R", () => {
            this.scene.start("platformerScene");
        });
    }
}

window.EndScene = EndScene;