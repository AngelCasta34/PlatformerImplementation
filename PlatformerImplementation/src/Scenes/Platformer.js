class Platformer extends Phaser.Scene { 
    constructor() {
        super("platformerScene");
    }

    init() {
        this.ACCELERATION      = 100;
        this.DRAG              = 500;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY     = -400;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE             = 4;
    }

    create() {
        const TILE_W = 9;
        const TILE_H = 9;

        this.map = this.add.tilemap("platformer-level-1", TILE_W, TILE_H, 45, 25);
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({ collides: true });

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key:  "tilemap_sheet",
            frame: 151
        });
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.coinGroup = this.add.group(this.coins);

        const spawnPoint = this.map.findObject("Objects", obj => obj.name === "Spawn");

        this.my = { sprite:{}, vfx:{} };
        this.my.sprite.player = this.physics.add
            .sprite(spawnPoint.x, spawnPoint.y, "platformer_characters", "tile_0000.png")
            .setOrigin(0.5, 1)
            .setScale(0.5)
            .setCollideWorldBounds(true);

        this.physics.add.collider(this.my.sprite.player, this.groundLayer);
        this.physics.add.overlap(
            this.my.sprite.player,
            this.coinGroup,
            (player, coin) => coin.destroy()
        );

        // Key bindings
        this.aKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.rKey = this.input.keyboard.addKey('R');
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }, this);

        // **Scaled-down smoke particles**
        this.my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame:   ['smoke_03','smoke_09'],
            scale:   { start: 0.015, end: 0.05 },  // ← half the size
            lifespan: 350,
            alpha:   { start: 1, end: 0.1 },
        }).stop();

        this.cameras.main
            .setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
            .startFollow(this.my.sprite.player, true, 0.25, 0.25)
            .setDeadzone(50, 50)
            .setZoom(this.SCALE);
    }

    update() {
        const p   = this.my.sprite.player;
        const vfx = this.my.vfx.walking;

        if (this.aKey.isDown) {
            p.setAccelerationX(-this.ACCELERATION);
            p.resetFlip();
            p.anims.play('walk', true);
            vfx.startFollow(p, p.displayWidth/2 - 10, p.displayHeight/2 - 5, false);
            vfx.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (p.body.blocked.down) vfx.start();

        } else if (this.dKey.isDown) {
            p.setAccelerationX(this.ACCELERATION);
            p.setFlip(true, false);
            p.anims.play('walk', true);
            vfx.startFollow(p, -p.displayWidth/2 + 10, p.displayHeight/2 - 5, false);
            vfx.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (p.body.blocked.down) vfx.start();

        } else {
            p.setAccelerationX(0);
            p.setDragX(this.DRAG);
            p.anims.play('idle');
            vfx.stop();
        }

        if (!p.body.blocked.down) {
            p.anims.play('jump');
        }
        if (p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            p.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}

window.Platformer = Platformer;
