// src/Scenes/Platformer.js
class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        this.ACCELERATION      = 100;
        this.DRAG              = 1800;
        this.physics.world.gravity.y = 100;
        this.JUMP_VELOCITY     = -400;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE             = 5;
    }

    create() {
        // 1) TILEMAP + GROUND
        const TILE_W = 9, TILE_H = 9;
        this.map = this.add.tilemap("platformer-level-1", TILE_W, TILE_H, 45, 25);
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({ collides: true });

        // 2) COINS
        this.coinGroup = this.physics.add.staticGroup();
        const coinObjects = this.map.getObjectLayer("Objects").objects
            .filter(obj => obj.name === "coin" && obj.gid);
        const firstGid = this.map.tilesets[0].firstgid;
        coinObjects.forEach(obj => {
            const frameIndex = obj.gid - firstGid;
            const coin = this.coinGroup.create(
                obj.x + TILE_W / 2,
                obj.y,
                "tilemap_sheet",
                frameIndex
            );
            coin.setOrigin(0.5, 1);
        });

        // 3) PLAYER
        const spawn = this.map.findObject("Objects", o => o.name === "Spawn");
        this.my = { sprite: {}, vfx: {} };
        this.my.sprite.player = this.physics.add
            .sprite(spawn.x, spawn.y, "platformer_characters", "tile_0000.png")
            .setOrigin(0.5, 1)
            .setScale(0.5)
            .setCollideWorldBounds(true);

        // Collide & overlap
        this.physics.add.collider(this.my.sprite.player, this.groundLayer);
        this.physics.add.overlap(
            this.my.sprite.player,
            this.coinGroup,
            (player, coin) => {
                coin.destroy();
                this.sound.play("sfx-coin");
            }
        );

        // 4) INPUT
        this.aKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.fKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.input.keyboard.on('keydown-F', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        });

        // 5) WALK VFX
        this.my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame:    ['smoke_03', 'smoke_09'],
            scale:    { start: 0.015, end: 0.05 },
            lifespan: 350,
            alpha:    { start: 1, end: 0.1 },
        }).stop();

        // 6) EXIT OBJECTS (using real GID)
        this.exitGroup = this.physics.add.staticGroup();
        const exitObjects = this.map.getObjectLayer("Objects").objects
            .filter(o => o.name === "Exit" && o.gid);
        exitObjects.forEach(o => {
            const frameIndex = o.gid - firstGid;
            this.exitGroup.create(
                o.x + TILE_W / 2,
                o.y,
                "tilemap_sheet",
                frameIndex
            )
            .setOrigin(0.5, 1);
        });

        // EndScene
        this.physics.add.overlap(
            this.my.sprite.player,
            this.exitGroup,
            () => this.scene.start("endScene")
        );

        // 7) CAMERA
        this.cameras.main
            .setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
            .startFollow(this.my.sprite.player, true, 0.25, 0.25)
            .setDeadzone(50, 50)
            .setZoom(this.SCALE);
    }

    update() {
        const p   = this.my.sprite.player;
        const vfx = this.my.vfx.walking;

        // left/right movement
        if (this.aKey.isDown) {
            p.setAccelerationX(-this.ACCELERATION);
            p.resetFlip();
            p.anims.play('walk', true);
            vfx.startFollow(p, p.displayWidth / 2 - 10, p.displayHeight / 2 - 5);
            vfx.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (p.body.blocked.down) vfx.start();

        } else if (this.dKey.isDown) {
            p.setAccelerationX(this.ACCELERATION);
            p.setFlip(true, false);
            p.anims.play('walk', true);
            vfx.startFollow(p, -p.displayWidth / 2 + 10, p.displayHeight / 2 - 5);
            vfx.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (p.body.blocked.down) vfx.start();

        } else {
            p.setAccelerationX(0);
            p.setDragX(this.DRAG);
            p.anims.play('idle');
            vfx.stop();
        }

        // jump
        if (!p.body.blocked.down) p.anims.play('jump');
        if (p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            p.body.setVelocityY(this.JUMP_VELOCITY);
        }

        // restart current scene
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) this.scene.restart();
    }
}

window.Platformer = Platformer;
