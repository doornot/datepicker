 function Calendar(options, callback) {
    var self = this;
    self.options = Object.assign({}, defaults, options || {});
    self.dateObj = self.options.dateObj;
    if(!self.dateObj) { return; }
    self.language = self.options.language;
    self.flag = false;
    self.callback = callback;

    self._init();
    self._bindEnv();
 };

 Calendar.prototype = {
    _init: function() {
        this._renderCalendarPanel();
    },

    // 渲染日历面板
    _renderCalendarPanel: function() {
        var self = this,
            options = self.options;
        if(self.dateObj.value.length > 0) {
            // input输入框有日期
            self.date = self._dateParse(self.dateObj.value);
        }
        self.date = new Date(self.date);
        if(isNaN(self.date.getFullYear())){
            self.date = new Date();
        }
        self.defYear = self.date.getFullYear();
        self.defMonth = self.date.getMonth() + 1;

        // 定义每月的天数
        self.month_day = new Array(31, 28 + self._leapYear(self.defYear), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);

        // 定义每周的日期
        self.date_name_week = self.language.weekList;

        // 定义周末
        self.saturday = 6 - options.wday;
        self.sunday = (7 - options.wday >= 7) ? 0 : (7-options.wday);
        
        // 创建日历面板dom节点
        var date_pane = document.createElement("div");
        date_pane.className = 'component_calendar';
        document.body.appendChild(date_pane);
        date_pane.innerHTML = '<div class="date_hd">' + 
            '<a class="date_pre" href="javascript://" rel="prev">&lt;</a>' + 
            '<a class="date_next" href="javascript://" rel="next">&gt;</a>' + 
            '<div class="date_txt"></div>' + 
            '<div class="date_set">' + 
                '<select class="year_set"></select> - ' + 
                '<select class="month_set"></select>' + 
            '</div>' + 
        '</div>' + 
        '<table class="date_table"></table>';
        var date_hd = document.querySelector(".date_hd"),
            date_table = document.querySelector(".date_table"),
            date_txt = document.querySelector(".date_txt"),
            date_set = document.querySelector(".date_set"),
            year_list = document.querySelector(".year_set"),
            month_list = document.querySelector(".month_set");
        var html_year_list = '',
            html_month_list = '',
            html_table = '';
        for(var i = options.beginyear; i < options.endyear; i++) {
            html_year_list +="<option value='" + i + "'>" + i + "</option>";
        }
        for(var i = 0; i < 12; i++) {
            html_month_list += '<option value="' + (i + 1) + '">' + self.language.monthList[i] + '</option>';
        }
        year_list.innerHTML = html_year_list;
        year_list.value = self.defYear;
        month_list.innerHTML = html_month_list;
        month_list.value = self.defMonth;

        html_table = '<thead><tr>';
        for(var i = 0; i < 7; i++) {
            // 遍历一周7天
            html_table += "<th class='"
            if(i == self.saturday) {
                html_table += " sat"; // 周末高亮
            }else if(i == self.sunday) {
                html_table += " sun";
            };
            html_table += "'>";
            html_table +=  (i + options.wday * 1 < 7) ? self.date_name_week[i+options.wday] : self.date_name_week[i+options.wday - 7];
            html_table += "</th>";
        };
        html_table += "</tr></thead><tbody></tbody>";
        date_table.innerHTML = html_table;

        // 创建遮罩层
        var block_bg = document.createElement("div");
        block_bg.className = 'component_calendar_lock';
        document.body.appendChild(block_bg);
        
        // 赋值 全局
        self.dateTxt = date_txt;
        self.yearList = year_list;
        self.monthList = month_list;
        self.dateTable = date_table;
        self.datePane = date_pane;
        self.date_hd = date_hd;
        self.blockBg = block_bg;
        self.dateSet = date_set;

        // 根据年份 月份来渲染天
        self._renderBody(self.defYear, self.defMonth);
    },

    // 渲染日历天数
    _renderBody: function(y, m) {
        var self = this;
        var options = self.options;
        if(m < 1) {
            y--;
            m = 12;
        } else if(m > 12) {
            y++;
            m = 1;
        }
        var tempM = m, cur_m = m;

        m--;  // 月份从0开始的
        var prevMonth = tempM - 1,  //上个月的月份
            prevDay = self._dayNumOfMonth(y,tempM - 1), // 上个月的天数
            nextMonth = tempM + 1,   // 下个月的月份
            nextDay = self._dayNumOfMonth(y,tempM + 1),  //下个月的天数
            curDay = self._dayNumOfMonth(y,tempM);       // 当前月份的天数
        self.month_day[1]=28+self._leapYear(y);  //闰年的话 29天 否则 28天
        var temp_html = "", temp_date = new Date(y,m,1);
        var now_date = new Date();
        now_date.setHours(0);
        now_date.setMinutes(0);
        now_date.setSeconds(0);
        
        // 如果输入框有值的话
        if(self.dateObj.value.length > 0) {
            var val_date = self._dateParse(self.dateObj.value)
        }
        val_date = new Date(val_date);
        if(isNaN(val_date.getFullYear())) {
            val_date = null;
        };
        // 获取当月的第一天
        var firstDay = temp_date.getDay() - options.wday < 0 ? temp_date.getDay() - options.wday + 7 : temp_date.getDay() - options.wday;
        // 每月所需要的行数
        var monthRows = Math.ceil((firstDay+self.month_day[m]) / 7);
        var td_num,
            day_num,
            diff_now,
            diff_set;
        var disabled;
        for(var i= 0; i < monthRows; i++) {
            temp_html += "<tr>";
            for(var j = 0; j < 7; j++) {
                td_num = i * 7 + j;
                day_num = td_num - firstDay + 1;
                if(day_num <= 0) {
                    if(day_num == 0) {
                        day_num = prevDay - day_num
                        text_m = prevMonth
                    }else {
                        day_num = prevDay + day_num;
                        text_m = prevMonth
                    }
                    
                }else if(day_num > self.month_day[m]){
                    day_num = day_num - curDay;
                    text_m = nextMonth
                }else {
                    text_m = cur_m;
                }
                temp_html += "<td";
                if(typeof(day_num) == 'number') {
                    diff_now = null;
                    diff_set = null;
                    temp_date = new Date(y,m,day_num);

                    if(text_m == cur_m) {
                        diff_now = Date.parse(now_date) - Date.parse(temp_date);
                        diff_set = Date.parse(val_date) - Date.parse(temp_date);
                    }
                    if(cur_m > text_m || cur_m < text_m) {
                        disabled = 'disabled';
                    }else {
                        disabled = "";
                    }
                    temp_html += (" title='" + y + options.separator + tempM+options.separator + day_num + "' class='num " + disabled + "");

                    if(diff_set == 0){    //选中 - select
                        temp_html += " selected";
                    }else if(diff_now == 0){
                        temp_html += " now";   // 当前时间 - now
                    }else if(j == self.saturday){
                        temp_html += " sat";   // 周六 - sat
                    }else if(j == self.sunday){
                        temp_html += " sun";   // 周日 - sun
                    };
                    temp_html += ("'");
                };
                temp_html += (" data-day='" + day_num + "'>" + day_num + "</td>");
            }
            temp_html += "</tr>";
        }
        self.dateTable.getElementsByTagName("tbody")[0].innerHTML = temp_html;
        self.dateTxt.innerHTML = "<span class='y'>" + y + "</span>" + options.language.year + "<span class='m'>" + options.language.monthList[m] + "</span>" + options.language.month;
        self.yearList.value = y;
        self.monthList.value = m + 1;
        return this;
    },

    // 各类事件绑定
    _bindEnv: function() {
        var self = this;
        self.dateObj.addEventListener('click',function() {
            self.show();
        });
        // 关闭面板事件
        self.blockBg.addEventListener('click',function() {
            self.hide();
        });
        // 点击上一页 下一页事件
        self.date_hd.addEventListener('click', function(ev) {
            var ev = ev || window.event;
            var target = ev.target || ev.srcElement;
            var _rel = target.getAttribute('rel');
            if(_rel == 'prev') {
                self._renderBody(self.yearList.value, parseInt(self.monthList.value,10) - 1);    
                return;
            }else if(_rel == 'next') {
                self._renderBody(self.yearList.value, parseInt(self.monthList.value,10) + 1);
                return;
            }
        }, true);
        // 选择日期事件
        self.datePane.addEventListener('click', function(ev) {
            var ev = ev || window.event;
            var target = ev.target || ev.srcElement;
            if(self.hasClass(target, 'num') && !self.hasClass(target, 'disabled')) {
                var tdLists = Array.prototype.slice.call(self.dateTable.getElementsByTagName("td"));
                tdLists.forEach(function(ele, i) {
                    self.removeClass(ele, 'selected');
                });
                self.addClass(target, 'selected');
                var day = target.getAttribute('data-day');
                self._selectDay(day);
            }
        }, true);
        // 显示年月选择
        self.dateTxt.addEventListener("click",function() {
            self.dateTxt.style.display = 'none';
            self.dateSet.style.display = 'block';
        });
        //更改年月事件
        self.yearList.addEventListener("change",function() {
            self._renderBody(self.yearList.value, self.monthList.value);
        });
        self.monthList.addEventListener("change",function() {
            self._renderBody(self.yearList.value, self.monthList.value);
        });
    },

    // 选择某一天
    _selectDay: function(d) {
        var self = this;
        var year,
            month;
        month = self.monthList.value;
        day = d;
        var options = self.options;
        if(options.type == 'yyyy-mm-dd') {
            month = "0" + self.monthList.value;
            day = "0" + d;
            month = month.substr((month.length - 2), month.length);
            day = day.substr((day.length - 2), day.length);
        }
        self.dateObj.value = self.yearList.value + options.separator + month + options.separator + day;
        self.hide();
        self.callback && self.isFunction(self.callback) && self.callback(self.yearList.value + options.separator + month + options.separator + day);
        return this;
    },

    // 显示日历面板
    show: function() {
        var self = this;
        if(self.flag) {
            return;
        }
        var pane_top = self.dateObj.getBoundingClientRect().top,
            pane_left = self.dateObj.getBoundingClientRect().left,
            obj_h = self.dateObj.offsetHeight;
        pane_top = pane_top + obj_h;
        self.datePane.style.top = pane_top + 'px';
        self.datePane.style.left = pane_left + 'px';
        self.datePane.style.display = 'block';
        self.blockBg.style.display = 'block';
        self.flag = true;
        return this;
    },

    // 隐藏日历面板
    hide: function() {
        var self = this;
        if(!self.flag) {return;}
        self.datePane.style.display = 'none';
        self.blockBg.style.display = 'none';
        self.dateSet.style.display = 'none';
        self.dateTxt.style.display = 'block';
        self.flag = false;
        return this;
    },

    _dayNumOfMonth: function(Year,Month) {
        var d = new Date(Year,Month,0);
        return d.getDate();
    },

    _dateParse: function(date) {
        newdate = date.replace(/\./g,"/");
        newdate = date.replace(/-/g,"/");
        newdate = date.replace(/\//g,"/");
        newdate = Date.parse(newdate);
        return newdate;
    },

    _leapYear: function(y) {
        // 闰年：1.能被4整除且不能被100整除 2.能被100整除且能被400整除
        return ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0) ? 1 : 0;
    },

    isFunction: function(fn) {
        return Object.prototype.toString.call(fn) === '[object Function]';
    },

    hasClass: function(obj, cls){
        var obj_class = obj.className,
        obj_class_lst = obj_class.split(/\s+/); // 通过split空字符将cls转换成数组.
        x = 0;
        for(x in obj_class_lst) {
            if(obj_class_lst[x] == cls) {
                return true;
            }
        }
        return false;
    },

    removeClass: function(obj, cls) {
        var obj_class = ' ' + obj.className + ' ';
        obj_class = obj_class.replace(/(\s+)/gi, ' '), // 将多余的空字符替换成一个空格.
        removed = obj_class.replace(' ' + cls + ' ', ' '); // 在原来的 class 替换掉首尾加了空格的 class.
        removed = removed.replace(/(^\s+)|(\s+$)/g, ''); // 去掉首尾空格.
        obj.className = removed;
    },

    addClass: function(obj, cls) {
        var obj_class = obj.className,
        blank = (obj_class != '') ? ' ' : ''; // 判断获取到的 class 是否为空, 如果不为空在前面加个'空格'.
        added = obj_class + blank + cls;
        obj.className = added;
    },
 };

 var defaults = {
    dateObj       :     '',             // 渲染日历的class
    beginyear     :     1900,           // 开始年份
    endyear       :     2050,           // 结束年份
    date          :     new Date(),     // 默认日期
    type          :     "yyyy-mm-dd",   // 日期格式
    separator     :     "-",            // 日期链接符
    wday          :     0,              // 周第一天
    language      :     { year:"年",
                          month:"月",
                          monthList:["1","2","3","4","5","6","7","8","9","10","11","12"],
                          weekList:["日","一","二","三","四","五","六"] }
 };