//saddly not used
module.exports = () => {
    const animationsController = {
        animations: []
    };

    animationsController.awaitFrame = () => animationsController.animations && animationsController.animations.length > 0;

    animationsController.addAnimation = (owner, animation) => {
        animation.owner = owner;
        animation.startTime = Date.now();
        animation.isPlaying = false;
        animation._onEnd = () => animationsController.animations = animationsController.animations.filter(f => f != animation);

        animationsController.animations.push(animation);
    };

    animationsController.cancelAnimations = (owner) => {
        animationsController.animations = animationsController.animations.filter(f => f.owner == owner);
    }

    return animationsController;
};