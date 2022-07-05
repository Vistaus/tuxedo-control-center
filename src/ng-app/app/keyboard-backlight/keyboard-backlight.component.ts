/*!
 * Copyright (c) 2019-2020 TUXEDO Computers GmbH <tux@tuxedocomputers.com>
 *
 * This file is part of TUXEDO Control Center.
 *
 * TUXEDO Control Center is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * TUXEDO Control Center is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TUXEDO Control Center.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../config.service';
import { Subscription } from 'rxjs';
import { TccDBusClientService } from '../tcc-dbus-client.service';
import { KeyboardBacklightCapabilitiesInterface, KeyboardBacklightColorModes } from '../../../common/models/TccSettings';

@Component({
    selector: 'app-keyboard-backlight',
    templateUrl: './keyboard-backlight.component.html',
    styleUrls: ['./keyboard-backlight.component.scss']
})
export class KeyboardBacklightComponent implements OnInit {
    Object = Object;

    public keyboardBacklightCapabilities: KeyboardBacklightCapabilitiesInterface;
    public chosenBrightness: number;
    public chosenColorHex: Array<string>;

    private subscriptions: Subscription = new Subscription();

    public gridParams = {
        cols: 9,
        headerSpan: 4,
        valueSpan: 2,
        inputSpan: 3
    };

    public gridParamsSymmetrical = {
        cols: 9,
        firstSpan: 3,
        secondSpan: 3,
        thirdSpan: 3
    };

    constructor(
        private config: ConfigService,
        private tccdbus: TccDBusClientService
    ) { }


    // Converts Int Value: 0xRRGGBBAA to string value "#RRGGBB"
    private rgbaIntToRGBSharpString (input: number): string {
        return "#" + input.toString(16).padStart(8, '0').substring(0, 6);
    }

    // Converts string Value: "#RRGGBB" to int value 0xRRGGBB00
    private rgbSharpStringToRGBAInt (input: string): number {
        return parseInt(input.substring(1, 7).padEnd(8, '0'), 16);
    }

    private clamp (input: number, min: number, max:number): number {
        return Math.min(Math.max(input, min), max);
    }

    public ngOnInit() {
        this.subscriptions.add(this.tccdbus.keyboardBacklightCapabilities.subscribe(
            keyboardBacklightCapabilities => {
                if (keyboardBacklightCapabilities != undefined) {
                    this.keyboardBacklightCapabilities = keyboardBacklightCapabilities;
                    this.chosenBrightness = this.clamp(this.chosenBrightness, 0, this.keyboardBacklightCapabilities.maxBrightness);
                    if (this.chosenColorHex.length != this.keyboardBacklightCapabilities.zones) {
                        this.chosenColorHex = this.chosenColorHex.slice(0, this.keyboardBacklightCapabilities.zones);
                        for (let i = 0; i < this.keyboardBacklightCapabilities.zones; i++) {
                            if (this.chosenColorHex[i] == undefined) {
                                this.chosenColorHex[i] = "#ffffff"
                            }
                        }
                    }
                }
            }
        ));
        this.chosenColorHex = [];
        for (let i = 0; i < this.config.getSettings().keyboardBacklightColor.length; i++) {
            this.chosenColorHex[i] = this.rgbaIntToRGBSharpString(this.config.getSettings().keyboardBacklightColor[i]);
        }
        this.chosenBrightness = this.config.getSettings().keyboardBacklightBrightness;
    }

    public onButtonClickApply() {
        this.config.getSettings().keyboardBacklightColorMode = KeyboardBacklightColorModes.static;
        this.config.getSettings().keyboardBacklightBrightness = this.chosenBrightness;
        this.config.getSettings().keyboardBacklightColor = [];
        for (let [i, color] of this.chosenColorHex.entries()) {
            this.config.getSettings().keyboardBacklightColor[i] = this.rgbSharpStringToRGBAInt(color);
        }
        this.config.saveSettings()
    }
}
