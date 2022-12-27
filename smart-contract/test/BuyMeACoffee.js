const { expect } = require("chai");

async function getBalance(address) {
      const balanceBigInt = await hre.waffle.provider.getBalance(address);
      const balance = hre.ethers.utils.formatEther(balanceBigInt);
      return parseInt(balance);
}

describe("BuyMeACoffee", function () {
    it("Deploy should work", async function () {
    // Get the example accounts we'll be working with.
      const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();

      // We get the contract to deploy.
      const BuyMeACoffee = await hre.ethers.getContractFactory("BuyMeACoffee");
      const buyMeACoffee = await BuyMeACoffee.deploy();

      // Deploy the contract.
      await buyMeACoffee.deployed();

        balance = await getBalance(tipper.address);
        expect(balance).to.equal(10000);

      const tip = {value: hre.ethers.utils.parseEther("10")};
      await buyMeACoffee.connect(tipper).buyCoffee("Carolina", "You're the best!", tip);

      const memos = await buyMeACoffee.getMemos();
      expect(memos.length).to.equal(1);
      expect(memos[0].from).to.equal(tipper.address);
      expect(memos[0].message).to.equal("You're the best!");
      expect(memos[0].name).to.equal("Carolina");

      balance = await getBalance(tipper.address);
      expect(balance).to.be.closeTo(9990, 2);

      balance = await getBalance(owner.address);
      expect(balance).to.be.closeTo(9999, 2);

      await buyMeACoffee.withdrawTips();
      balance = await getBalance(owner.address);
      expect(balance).to.be.closeTo(10009, 2);

});
});