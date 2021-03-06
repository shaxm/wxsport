//index.js
//获取应用实例
var app = getApp()
var lastSendTime = new Date().getTime()
const tipsDuration = 800

Page({
  data: {
    activity: {
      title: "行走的力量",
      image: "../../images/banner.png"
    },
    modal: {
      hidden: true,
      typo: null,
      errMessage: null,
      data: {},
    },
    topDonates: [],
  },

  onLoad: function () {
    var that = this
    app.getUserCookie(function(cookie) {
      // 更新用户信息
      that.updateUserInfo();
    });
  },

  onShow: function () {
    var that = this
    app.getUserCookie(function (cookie) {
      // 获取 activity 信息
      that.getActivityInfo();
    });
  },

  // 更新用户基础信息
  updateUserInfo: function(e) {
    app.getUserInfo(function (userInfo) {
      //更新数据
      wx.request({
        url: app.makeRequestUrl("/api/user"),
        method: "POST",
        data: {
          userinfo: userInfo
        },
        header: {
          'Cookie': app.globalData.cookie,
        }
      })
    });
  },

  // 获取 activity 信息
  getActivityInfo: function() {
    var that = this;
    wx.request({
      url: app.makeRequestUrl("/api/activity"),
      method: "GET",
      header: {
        'Cookie': app.globalData.cookie,
      },
      success: function (res) {
        that.setData({
          activity: res.data
        });
        wx.setNavigationBarTitle({
          title: res.data.title
        });

        that.getTop10Donates(res.data.id);
      }
    })
  },

  //获取 top 10 donates 信息
  getTop10Donates: function(activityId) {
    var that = this;
    wx.request({
      url: app.makeRequestUrl("/api/sports"),
      method: "GET",
      header: {
        'Cookie': app.globalData.cookie,
      },
      data: {
        activity_id: activityId,
      },
      success: function (res) {
        that.setData({
          topDonates: res.data
        });
      }
    }) 
  },

  onSubmit: function(e) {
    let currentTime = new Date().getTime();
    if (currentTime - lastSendTime < 1500) {
      return null;
    }
    lastSendTime = currentTime;

    wx.showToast({
      title: '正在提交数据，请勿重复点击',
      icon: 'success',
      image: '../../images/checked.png',
      duration: tipsDuration
    });

    var that = this;
    wx.getWeRunData({
      success(res) {
        wx.request({
          url: app.makeRequestUrl("/api/sport"),
          method: "POST",
          data: {
            encrypted_data: res.encryptedData,
            iv: res.iv,
            activity_id: that.data.activity.id,
          },
          header: {
            'Cookie': app.globalData.cookie,
          },
          success: function(res) {
            var modalStatus = {
              hidden: false,
              data: res.data,
            }

            if (res.statusCode == 200) {
              modalStatus.typo = 0 
            } else if (res.statusCode == 408){
              modalStatus.typo = 1
            } else if (res.statusCode == 400){
              modalStatus.typo = 2
            } else {
              modalStatus.typo = 3
            }
            var costTime = new Date().getTime() - currentTime;
            if (costTime < 0) {
              costTime = 400;
            }

            setTimeout(function () {
              that.setData({
                modal: modalStatus
              });}, tipsDuration - costTime + 300);
          }
        })
      },
      fail(data) {
        wx.showToast({
          title: '请确认已授权获取运动数据',
          icon: "success",
          duration: 1000
        })
      }
    })
  },

  onModalHide: function(e) {
    this.setData({
      modal: {
        hidden: true,
        typo: null,
        data: null,
        errMessage: null,
      }
    });
  },

  onShowBannerInfo: function(e) {
    this.setData({
      modal: {
        hidden: false,
        typo: 4,
      }
    });
  }
})
