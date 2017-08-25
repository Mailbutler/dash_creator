require_dependency "dash_creator/application_controller"

module DashCreator
  class DashboardController < ApplicationController
    skip_before_action :verify_authenticity_token

    def get_dashboard
      user = user_for_dash_creator
      dashboard = DashCreator::Dashboard.where(user_id: user.id).find(params[:dashboard_id])

      render json: dashboard.options
    end

    def save_dashboard
      user = user_for_dash_creator
      dashboard = DashCreator::Dashboard.where(user_id: user.id).create(name: params[:dashboard_name], options: params[:options])

      render json: {dashboard_id: dashboard.id}
    end

    def edit_dashboard
      user = user_for_dash_creator
      dashboard = DashCreator::Dashboard.where(user_id: user.id).find(params[:dashboard_id])
      dashboard.update_attribute(:options, params[:options])

      render json: {dashboard_id: dashboard.id}
    end

    def delete_dashboards
      user = user_for_dash_creator
      DashCreator::Dashboard.where(user_id: user.id).where(id: params[:dashboards_ids]).destroy_all
    end
  end
end
